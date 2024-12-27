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
async function checkDownload(alist, url, minSizeMB, downloadTimeSec) {
  // 临时文件路径，用于存放下载的文件片段
  const tempFilePath = path.join(TEMP_DIR, `${alist}-${Date.now()}.tmp`);
  let downloadCompleted = false; // 标记下载是否完成

  try {
    const writer = fs.createWriteStream(tempFilePath); // 用于写入下载的文件
    const response = await axios({
      url: url, // 下载地址
      method: 'GET', // HTTP GET 方法
      responseType: 'stream', // 请求响应为流
      timeout: 30 * 1000, // 设置超时时间为 30 秒
    });

    // 创建 Promise，用于监听文件写入完成事件
    const downloadPromise = new Promise((resolve, reject) => {
      // 将 HTTP 响应流写入到文件
      response.data.pipe(writer);

      // 当文件写入完成时，标记为下载完成
      writer.on('finish', () => {
        downloadCompleted = true; // 标记为下载完成
        resolve(); // 下载完成，Promise 成功
      });

      // 如果文件写入发生错误，触发 Promise 的失败
      writer.on('error', reject);
    });

    // 创建一个定时器，用于在自定义时间后停止下载
    const stopDownload = new Promise((resolve) => {
      setTimeout(() => {
        // 如果下载未完成，则停止下载流
        if (!downloadCompleted) {
          response.data.destroy(); // 停止下载流（中断传输）
          writer.end(); // 结束文件写入
          resolve(); // 停止下载后继续后续逻辑
        }
      }, downloadTimeSec * 1000); // 使用配置的下载时间（单位：秒）
    });

    // 同时等待下载完成或自定义时间超时事件，先完成的优先执行
    await Promise.race([downloadPromise, stopDownload]);

    // 检查文件大小
    const stats = fs.statSync(tempFilePath); // 获取文件状态
    const fileSizeMB = stats.size / (1024 * 1024); // 将文件大小转换为 MB

    // 判断文件大小是否符合要求
    if (fileSizeMB >= minSizeMB) {
      // 文件大小符合要求，记录日志并返回成功
      writeLog(`${alist}，检测成功，已下载的文件大小：${fileSizeMB.toFixed(2)} MB`);
      fs.unlinkSync(tempFilePath); // 删除临时文件
      return true;
    } else {
      // 文件大小不符合要求，记录日志并返回失败
      writeLog(
        `${alist}，检测失败，文件大小仅为：${fileSizeMB.toFixed(2)} MB，低于预期的 ${minSizeMB} MB`
      );
      fs.unlinkSync(tempFilePath); // 删除临时文件
      return false;
    }
  } catch (error) {
    // 捕获错误信息并记录日志
    writeLog(`${alist}，检测失败，错误信息：${error.message}`);
    // 如果发生错误，清理未完成的临时文件
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    return false;
  }
}

// 主函数
async function main() {
  const configPath = path.join(__dirname, 'config.js');
  if (!fs.existsSync(configPath)) {
    console.error('配置文件 config.js 不存在，请创建后重试！');
    process.exit(1);
  }

  const tasks = require(configPath);

  if (!Array.isArray(tasks) || tasks.length === 0) {
    console.error('配置文件中没有任务，请添加后重试！');
    process.exit(1);
  }

  writeLog('程序已启动，正在进行定时检测...');

  const intervals = [];
  for (const task of tasks) {
    const { alist, interval, url, minSizeMB, downloadTimeSec } = task;

    if (!alist || !interval || !url || !minSizeMB || !downloadTimeSec) {
      console.error(`任务配置错误，请检查：${JSON.stringify(task)}`);
      process.exit(1);
    }

    const success = await checkDownload(alist, url, minSizeMB, downloadTimeSec);

    if (!success) {
      console.error('首次检测失败，程序已停止。');
      process.exit(1);
    }

    intervals.push(
      setInterval(async () => {
        const success = await checkDownload(alist, url, minSizeMB, downloadTimeSec);

        if (!success) {
          for (const intervalId of intervals) {
            clearInterval(intervalId);
          }
          console.error('检测失败，程序已停止。');
          process.exit(1);
        }
      }, interval * 60 * 1000)
    );
  }
}

// 启动主程序
main();
