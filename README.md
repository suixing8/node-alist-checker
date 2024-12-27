# node-alist-checker
定时自动检测alist，如果alist掉cookie等问题无法使用时，可使用宝塔通过微信邮件等进行提醒<br><br>

# 要求
Node.js 10 及以上版本<br><br>

# 教程（宝塔为例）
## 1.下载后解压
https://github.com/user-attachments/files/18259774/node-alist-checker_V1.0.0.gz<br><br>
或者<br><br>
```bash
wget https://github.com/user-attachments/files/18259774/node-alist-checker_V1.0.0.gz
```
![image](https://github.com/user-attachments/assets/56e836b5-98ae-42ac-91e4-4a612a3987b4)<br><br>

## 2.修改配置文件config.js
// 配置文件说明：<br><br>
// 1. alist：任务名称，用于标识日志输出。<br><br>
// 2. interval：任务执行的时间间隔，单位为分钟。<br><br>
// 3. url：需要检测的文件下载链接。<br><br>
// 4. minSizeMB：文件的最小大小（单位：MB）。如果文件大小低于此值，则判读检测失败。可以默认，但是你检测的链接文件需要超过1MB，建议放一个1-10M的文件链接用来检测<br><br>

![image](https://github.com/user-attachments/assets/869d448b-0395-4ca4-b75b-e55c8dfb013a)<br><br>

## 3.添加node项目
添加后运行该项目<br><br>
![image](https://github.com/user-attachments/assets/88bd5c31-583a-433e-ade4-54959ae70914)<br><br>

## 4.添加宝塔通知
选择一个方式进行绑定<br><br>
![image](https://github.com/user-attachments/assets/21e3e2e8-1ea7-44c0-b081-7552483de2b7)<br><br>
添加对改项目的检测并配置通知
![image](https://github.com/user-attachments/assets/01c52b0e-287f-4b78-a922-d24f9850b82b)<br><br>

## 5.查看日志
![image](https://github.com/user-attachments/assets/281edb2f-d1fc-4496-8706-f371b0dd5747)

