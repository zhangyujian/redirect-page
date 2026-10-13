export const advancedSources = {
  curl: {
    title: 'curl：HTTP 响应与退出码',
    url: 'https://curl.se/docs/manpage.html',
    summary: '对照响应头、连接失败与 --fail 的区别；本应用不模拟 TLS、代理或完整 curl 参数。',
  },
  logging: {
    title: 'OWASP：日志关联与敏感信息处理',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html',
    summary: '理解事件时间、交互标识和数据最小化；本站案例与日志均为自行编写的教学样本。',
  },
  paths: {
    title: 'Linux：路径解析与目录访问权限',
    url: 'https://www.man7.org/linux/man-pages/man7/path_resolution.7.html',
    summary: '读取文件还需要沿途目录的搜索权限；不要用全目录开放权限替代定位。',
  },
  pipelines: {
    title: 'GNU Bash：管道与退出状态',
    url: 'https://www.gnu.org/software/bash/manual/html_node/Pipelines',
    summary: '未启用 pipefail 时，管道状态通常取最后一条命令；本沙盒只演示该默认行为，不执行完整 Bash 脚本。',
  },
  grep: {
    title: 'GNU grep：匹配、未匹配与错误',
    url: 'https://www.gnu.org/software/grep/manual/html_node/Exit-Status.html',
    summary: '区分正常匹配、正常未匹配和执行错误，不能把所有非零状态都解释为同一问题。',
  },
  apt: {
    title: 'Debian APT：候选版本与策略查询',
    url: 'https://manpages.debian.org/trixie/apt/apt-cache.8.en.html',
    summary: 'policy 查询本地索引和选择策略；候选不是安装结果，也不自动代表当前远端仓库状态。',
  },
  aptSimulation: {
    title: 'Debian APT：模拟事务的能力边界',
    url: 'https://manpages.debian.org/trixie/apt/apt-get.8.en.html',
    summary: '模拟模式用于检查计划，不能替代真实环境的权限、依赖、空间和恢复验证。',
  },
  kaliRepositories: {
    title: 'Kali：当前软件源配置说明',
    url: 'https://www.kali.org/docs/general-use/kali-apt-sources/',
    summary: '核对现代 kali.sources 与旧 sources.list 布局，按本机配置判断；不要混入其他发行版的软件源。',
  },
  pacman: {
    title: 'Arch：pacman 查询、组与同步事务',
    url: 'https://man.archlinux.org/man/pacman.8',
    summary: '区分本地数据库、同步数据库和软件组；真实完整升级可能涉及很多依赖，离线模型不计算真实事务。',
  },
  systemctl: {
    title: 'systemd：运行、启用与服务状态',
    url: 'https://man.archlinux.org/man/systemctl.1.en',
    summary: '启动配置、进程运行状态与业务就绪分别验收；修改服务前保留管理通道和恢复条件。',
  },
  openrcDependencies: {
    title: 'OpenRC：服务依赖与启动顺序',
    url: 'https://github.com/OpenRC/openrc/blob/master/service-script-guide.md',
    summary: '理解 need、use 与 after 的差异。本模拟器没有依赖调度器，不能据样本推断真实启动顺序。',
  },
  equery: {
    title: 'Gentoo gentoolkit：equery 查询',
    url: 'https://github.com/gentoo/gentoolkit/blob/master/man/equery.1',
    summary: '结合本地帮助理解已安装包、文件和 USE 信息；应用只提供 list、files、uses 的简化样本。',
  },
}
