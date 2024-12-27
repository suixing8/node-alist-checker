// 配置文件说明：
// 1. alist：任务名称，用于标识日志输出。
// 2. interval：任务执行的时间间隔，单位为分钟。
// 3. url：需要检测的文件下载链接。
// 4. minSizeMB：文件的最小大小（单位：MB）。如果文件大小低于此值，则检测失败。

module.exports = [
  {
    alist: "alist1", // 任务1的标识符
    interval: 30, // 每 1 分钟执行一次检测
    url: "http://adb.com:5244/d/xxxx.mp4", // 文件下载链接
    minSizeMB: 1 // 文件大小最低要求 1 MB
  },
  {
    alist: "alist2", // 任务2的标识符
    interval: 30, // 每 1 分钟执行一次检测
    url: "http://adb.com:5344/d/xxxx.mp4", // 文件下载链接
    minSizeMB: 1 // 文件大小最低要求 1 MB
  }
];
