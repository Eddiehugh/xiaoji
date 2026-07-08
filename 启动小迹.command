#!/bin/zsh
cd "${0:A:h}"
npm run start:product
status=$?
printf "\n启动器已退出，状态码：%s\n" "$status"
printf "按任意键关闭窗口..."
read -k 1
exit "$status"
