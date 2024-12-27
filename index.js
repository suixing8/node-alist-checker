const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 日志文件夹路径
const LOG_DIR = path.join(__dirname, 'logs');
// 全部日志文件路径
const ALL_LOG_PATH = path.join(LOG_DIR, 'all.log');
// 临时文件夹路径，用于存放下载的临时文件
const TEMP_DIR = path.join(__dirname, 'temp');

// 初始化日志文件夹和临时文件夹
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

// 写日志函数
function writeLog(message) {
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
  const logMessage = `[${timestamp}] ${message}\n`;

  // 写入全部日志
  fs.appendFileSync(ALL_LOG_PATH, logMessage);

  // 写入当天日志
  const dailyLogPath = path.join(LOG_DIR, `${timestamp.split(' ')[0]}.log`);
  fs.appendFileSync(dailyLogPath, logMessage);

  console.log(logMessage.trim());
}

// 下载检测函数
async function checkDownload(alist, url, minSizeMB) {
  const tempFilePath = path.join(TEMP_DIR, `${alist}-${Date.now()}.tmp`);

  try {
    const writer = fs.createWriteStream(tempFilePath);
    const response = await axios({
      url: url,
      method: 'GET',
      responseType: 'stream',
      timeout: 30 * 1000, // 设置超时时间为 30 秒
    });

    // 将流写入临时文件
    response.data.pipe(writer);

    // 等待流写入完成
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // 检查文件大小
    const stats = fs.statSync(tempFilePath);
    const fileSizeMB = stats.size / (1024 * 1024); // 转换为 MB

    if (fileSizeMB >= minSizeMB) {
      writeLog(`${alist}，检测成功，文件大小：${fileSizeMB.toFixed(2)} MB`);
      fs.unlinkSync(tempFilePath); // 删除临时文件
      return true;
    } else {
      writeLog(`${alist}，检测失败，文件大小仅为：${fileSizeMB.toFixed(2)} MB，低于预期的 ${minSizeMB} MB`);
      fs.unlinkSync(tempFilePath); // 删除临时文件
      return false;
    }
  } catch (error) {
    // 捕获错误信息
    writeLog(`${alist}，检测失败，错误信息：${error.message}`);
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath); // 清理未完成的临时文件
    }
    return false;
  }
}

// 主函数
async function main() {
  // 读取配置文件
  const configPath = path.join(__dirname, 'config.js');
  if (!fs.existsSync(configPath)) {
    console.error('配置文件 config.js 不存在，请创建后重试！');
    process.exit(1);
  }

  // 加载配置文件内容
  const tasks = require(configPath);

  // 检查任务是否存在
  if (!Array.isArray(tasks) || tasks.length === 0) {
    console.error('配置文件中没有任务，请添加后重试！');
    process.exit(1);
  }

  // 显示程序启动提示
  writeLog('程序已启动，正在进行定时检测...');

  // 定时任务
  const intervals = [];
  for (const task of tasks) {
    const { alist, interval, url, minSizeMB } = task;

    // 检查参数有效性
    if (!alist || !interval || !url || !minSizeMB) {
      console.error(`任务配置错误，请检查：${JSON.stringify(task)}`);
      process.exit(1);
    }

    // 启动前立即执行一次检测
    const success = await checkDownload(alist, url, minSizeMB);

    // 如果第一次检测失败，直接停止程序
    if (!success) {
      console.error('首次检测失败，程序已停止。');
      process.exit(1);
    }

    // 启动定时任务
    intervals.push(
      setInterval(async () => {
        const success = await checkDownload(alist, url, minSizeMB);

        // 如果检测失败，停止所有任务
        if (!success) {
          for (const intervalId of intervals) {
            clearInterval(intervalId);
          }
          console.error('检测失败，程序已停止。');
          process.exit(1);
        }
      }, interval * 60 * 1000) // 将分钟转换为毫秒
    );
  }
}

// 启动主程序
main();
