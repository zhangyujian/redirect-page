export const COURSE_REVIEWED_AT = '2026-09-02'

export function point(title, explanation, task, verification) {
  return { title, explanation, task, verification }
}

export function example(code, output, explanation, environment = 'sandbox', setup = '从本系统新建的沙盒初始目录开始；输出为教学示例，实际路径与版本可能不同。') {
  return { kind: 'command', code, output, explanation, environment, setup }
}

export function course(data) {
  return {
    ...data,
    reviewedAt: COURSE_REVIEWED_AT,
    sections: {
      overview: {
        intro: data.scenario,
        topics: [
          point('本课要解决的问题', data.problem, data.assignment, data.deliverable),
          point('开始前准备什么', data.prerequisites.join(' '), data.preparation, data.readyWhen),
          point('学完以后能做什么', data.goals.join(' '), data.reflection, data.standard),
        ],
        example: { kind: 'record', code: data.record, explanation: data.recordExplanation },
        pitfall: data.pitfalls[0], check: data.checks[0],
      },
      concepts: {
        intro: data.conceptIntro, topics: data.concepts,
        example: data.conceptExample, pitfall: data.pitfalls[1], check: data.checks[1],
      },
      workflow: {
        intro: data.workflowIntro, topics: data.workflow,
        example: data.workflowExample, pitfall: data.pitfalls[2], check: data.checks[2],
      },
    },
  }
}

export const readingSources = {
  pentooIntro: {
    title: 'Pentoo 定位与 overlay', source: 'Pentoo 官方网站', url: 'https://pentoo.org/about/',
    summary: 'Pentoo 把 Gentoo 基础与安全工具 overlay 结合起来。这里先理解发行版、额外仓库与工具之间的关系，不把官网的历史安装命令直接复制到新系统。',
    points: ['Live 环境适合独立实验，但不自动等于网络隔离。', 'overlay 是额外软件仓库，不是虚拟机快照。', '官网部分步骤仍提到 layman；实际仓库配置请结合当前 Gentoo 工具与本机状态核对。'],
  },
  pentooFaq: {
    title: 'Pentoo 常见问题', source: 'Pentoo 官方网站', url: 'https://pentoo.org/faqs/',
    summary: '常见问题明确说明 Pentoo 基于 Gentoo，并通过 emerge 使用 Portage。将系统家族核对清楚，再处理更新、持久化与安装问题。',
    points: ['不把 APT 或 pacman 命令当作 Pentoo 的系统包管理方式。', 'Live 会话中的修改是否保留取决于持久化配置；先验证再依赖。', '旧 FAQ 提到的更新脚本与启动参数需核对当前镜像，课程不自动执行这些操作。'],
  },
  portage: {
    title: 'emerge 动作与依赖预览', source: 'Gentoo Portage 官方手册', url: 'https://dev.gentoo.org/~zmedico/portage/doc/man/emerge.1.html',
    summary: '把搜索、同步、预览和安装分开理解。手册完整参数远多于应用模拟器，遇到差异应阅读本机 emerge --help 和对应版本文档。',
    points: ['--search 查名称，--searchdesc 同时检查描述；候选不等于已安装。', '--pretend 只列计划；--ask 在真实变更前让用户审阅并确认。', '@world 是包集合；--update --deep --newuse 影响更新和依赖计算，不是“一定要安装所有工具”。'],
  },
  portageConfig: {
    title: 'Portage 配置与 USE', source: 'Gentoo Portage 官方手册', url: 'https://dev.gentoo.org/~zmedico/portage/doc/man/make.conf.5.html',
    summary: 'USE 表达构建功能选择，不能简单理解成安全开关。先观察有效配置与包计划，再考虑在可恢复环境中做小范围改变。',
    points: ['全局设置和包级设置可能共同影响最终构建选项。', '修改构建配置可能需要重新构建相关包，不只是改变一行文字。', '课程文件是简化样本，不推荐直接覆盖真实 make.conf；真实变更先保存原件并读本机手册。'],
  },
  openrc: {
    title: 'OpenRC 服务命令', source: 'OpenRC 官方手册', url: 'https://github.com/OpenRC/openrc/blob/master/man/rc-service.8',
    summary: 'rc-service 定位并调用服务脚本，命令格式是服务名在前、动作在后。课程选用 OpenRC 教学模型，真实镜像应先确认自己的 init 与服务名称。',
    points: ['先查 status，再决定是否需要 start、stop 或 restart。', '不同服务脚本支持的动作可能不同，应阅读该服务的实际说明。', 'lab-web 是应用专用样本，不是 Pentoo 默认安装的真实服务。'],
  },
  openrcUpdate: {
    title: 'OpenRC 运行级别配置', source: 'OpenRC 官方手册', url: 'https://github.com/OpenRC/openrc/blob/master/man/rc-update.8',
    summary: 'rc-update 管理服务在运行级别中的配置，与当前进程是否正在运行应分别核对。先用 show 观察，再在需要时更改。',
    points: ['add 与 del 添加或删除运行级别关联，不应等同于立即启动或停止。', '课程只模拟 default，真实系统可能存在多个运行级别与依赖。', '完成变更后，同时验证运行状态、启用配置和实际业务表现。'],
  },
  kaliIntro: {
    title: 'Kali 的用途与适用人群', source: 'Kali 官方文档', url: 'https://www.kali.org/docs/introduction/what-is-kali-linux/',
    summary: 'Kali 是以安全工作为目标组织工具与配置的 Debian 系发行版。先区分“操作系统”“工具”和“任务”，再阅读各工具页面。',
    points: ['定位：安全审计、测试与取证工作环境，不是自动完成任务的程序。', '前置能力：官方文档通常假定读者已经了解 Linux 基础。', '阅读后练习：写出一个学习任务及其需要的最少工具，避免以安装数量衡量能力。'],
  },
  kaliBranches: {
    title: 'Kali 分支说明', source: 'Kali 官方文档', url: 'https://www.kali.org/docs/general-use/kali-branches/',
    summary: '分支影响软件包何时更新，不是桌面主题或虚拟机快照。理解更新节奏后，再决定实验环境是否需要固定版本。',
    points: ['kali-rolling 是默认持续更新分支；检查可安装性不等于所有工具永远没有故障。', 'kali-last-snapshot 随版本发布推进，不会像 rolling 一样持续收到所有更新；不应把两个主分支同时启用。', '开发、实验和 bleeding-edge 分支有不同用途，初学课程无需添加。'],
  },
  kaliUpdate: {
    title: 'Kali 更新流程', source: 'Kali 官方文档', url: 'https://www.kali.org/docs/general-use/updating-kali/',
    summary: '更新前核对官方源并保存可恢复状态。apt update 刷新索引，apt full-upgrade 计算整体升级事务，两者作用不同。',
    points: ['阅读事务中“新增、升级、移除”的包名单，不为省事直接自动确认。', '实际任务前验证工具，任务进行期间不要随意改变系统版本。', '软件源文件可能采用新的 .sources 格式；旧镜像不要机械覆盖配置，应对照当前官方说明。'],
  },
  kaliVM: {
    title: 'Kali 虚拟机安装示例', source: 'Kali 官方文档', url: 'https://www.kali.org/docs/virtualization/install-virtualbox-guest-vm/',
    summary: '这篇文档展示在 VirtualBox 中安装 Kali 的过程。阅读时重点看虚拟磁盘、硬件配置和安装流程，参数应结合自己的电脑资源。',
    points: ['确认安装对象是虚拟磁盘，不是存放个人数据的实体磁盘。', '本课程建议先关闭不必要的共享目录、共享剪贴板和拖放功能。', '网络可达范围和快照要另外检查；“成功启动”不等于“已隔离”。'],
  },
  bash: {
    title: 'Bash 语法与重定向', source: 'Arch 收录的上游手册', url: 'https://man.archlinux.org/man/bash.1.en',
    summary: '先读引号、简单命令、管道和重定向，再看脚本控制结构。手册覆盖完整 Bash，而本应用只模拟其中一部分。',
    points: ['空格分隔参数，带空格的路径应使用引号。', '| 连接标准输出与标准输入；> 覆盖目标文件，>> 追加内容。', '&& 按前一条的退出状态决定是否继续；它不能替代检查命令输出。'],
  },
  nmap: {
    title: 'Nmap 服务与版本探测', source: 'Nmap 官方手册', url: 'https://nmap.org/book/man-version-detection.html',
    summary: '端口号只能提示常见用途，服务也能运行在非标准端口。-sV 会进一步与服务交互，收集协议与版本线索。',
    points: ['先理解 PORT、STATE、SERVICE、VERSION 四类字段。', '识别结果依赖对端回应和探针匹配，不能直接当作漏洞证据。', '版本探测会发起实际请求，真实环境必须限定目标、端口和允许的动作。'],
  },
  journal: {
    title: 'journalctl 日志查询', source: 'Arch 收录的 systemd 手册', url: 'https://man.archlinux.org/man/journalctl.1.en',
    summary: '按服务、启动周期、时间与优先级缩小日志范围，再保留上下文解释事件。查询条件决定你看到了什么，也决定哪些事件被排除。',
    points: ['-b 选择启动周期，-u 选择服务单元，-n 限制最近行数。', '--since 限制开始时间；-p warning 包含 warning 及更严重级别，并非仅含该级别。', '普通用户可能看不到全部日志；样本缺失、保留周期和时区都要说明。'],
  },
  systemctl: {
    title: 'systemctl 服务管理', source: 'Arch 收录的 systemd 手册', url: 'https://man.archlinux.org/man/systemctl.1.en',
    summary: '运行状态与开机启用状态是两件事。先用 status 和 list-units 观察，再在确认依赖后决定是否变更。',
    points: ['stop 停止当前运行，disable 取消启用配置；两者不等价。', 'enable --now 同时配置启用并启动；status 的退出码也可表示服务未运行。', '不同发行版单元名可能不同，例如 ssh 与 sshd；本应用提供 lab-web 作为专门教学服务。'],
  },
  parrotEditions: {
    title: 'Parrot 版本选择', source: 'Parrot 官方文档', url: 'https://parrotsec.org/docs/introduction/download-parrot/',
    summary: 'Security 与 Home 的关键差异是预装软件集合。选型应跟学习目标、资源和维护能力匹配，而不是把工具多等同于更安全。',
    points: ['Security 提供较完整的安全工作工具集合。', 'Home 提供较精简的初始环境，可从同一套仓库按需补充工具。', '镜像架构、桌面和硬件要求以当前下载页面为准，不靠旧截图判断版本。'],
  },
  parrotPackages: {
    title: 'Parrot 软件与更新管理', source: 'Parrot 官方文档', url: 'https://parrotsec.org/docs/configuration/parrot-software-management/',
    summary: 'Parrot 使用 APT 管理软件。查询、安装与整体升级属于不同操作，应理解索引、依赖和官方源之间的关系。',
    points: ['search 找候选，show 读说明，list --installed 查看本地安装状态。', '整体系统更新优先使用官方的 sudo parrot-upgrade 流程。', '不要因为同为 Debian 系就把 Kali 或 Ubuntu 的源添加进 Parrot。'],
  },
  anonsurf: {
    title: 'AnonSurf 能做什么', source: 'Parrot 官方文档', url: 'https://parrotsec.org/docs/tools/anonsurf/',
    summary: 'AnonSurf 管理通过 Tor 的连接路径，但网络路径变化不能消除账号、文件内容和行为上的身份关联。',
    points: ['先阅读 CLI 子命令和影响范围，不在关键会话中随意启停。', '应用内只提供 status 的离线教学结果，不建立 Tor 连接。', '本课程的隐私练习重点是最小数据共享与身份隔离，不承诺“完全匿名”。'],
  },
  apparmor: {
    title: 'AppArmor 访问约束', source: 'Parrot 官方文档', url: 'https://parrotsec.org/docs/configuration/apparmor/',
    summary: 'AppArmor 按配置限制程序可访问的资源。它属于进程权限控制，不是负责清理文件元数据或隐藏网络身份的工具。',
    points: ['核对是否有针对该程序的 profile，以及当前 enforcement 状态。', '发生拒绝时先读日志和策略，不应为了让程序运行而整体关闭防护。', '按最小必要范围调整并复测正常功能与被禁止的访问。'],
  },
  ss: {
    title: 'ss 套接字查询', source: 'Linux 手册', url: 'https://man7.org/linux/man-pages/man8/ss.8.html',
    summary: '把监听地址、端口和进程一起看，才能描述本机暴露面。此工具检查本机套接字，不等于从外网测试可达性。',
    points: ['-t 与 -u 分别选择 TCP 和 UDP，-l 选择监听项。', '-n 保留数字地址与端口，-p 尝试显示关联进程。', '127.0.0.1、具体网卡地址、0.0.0.0 与 IPv6 的 :: 有不同范围；仍需结合路由与防火墙。'],
  },
  venv: {
    title: 'Python 虚拟环境', source: 'Python 官方文档', url: 'https://docs.python.org/3/library/venv.html',
    summary: 'venv 为项目创建独立的 Python 环境。它隔离依赖目录，不是权限边界，也不是用于执行不可信代码的安全沙盒。',
    points: ['python3 -m venv .venv 创建环境；激活只是调整当前 Shell 的环境变量。', '不激活时也可以直接使用 .venv/bin/python 执行项目命令。', '迁移项目时根据依赖描述重建环境，不把 .venv 当作可移植备份。'],
  },
  blackarchInstall: {
    title: 'BlackArch 安装方案', source: 'BlackArch 官方网站', url: 'https://blackarch.org/downloads.html',
    summary: '比较 Slim、Netinstall、Full 和已有 Arch 上的仓库方式，重点是安装内容、更新成本和恢复能力。',
    points: ['官方明确提醒 Full ISO 可能遇到安装和更新冲突，主要面向确有需要的离线场景。', 'Slim 提供选定工具，Netinstall 便于按需构建；都需要后续维护。', '仓库引导会修改系统信任与软件源，应按当前官方流程核验，不复制来历不明的脚本。'],
  },
  blackarchTools: {
    title: 'BlackArch 工具与分类', source: 'BlackArch 官方网站', url: 'https://blackarch.org/tools.html',
    summary: '工具表提供包名、分类、描述和上游入口。先按任务缩小候选，再看项目文档，分类名称本身不是操作教程。',
    points: ['取证任务与网络发现任务关注不同的数据和输出。', '工具可能属于多个组；“包”“组”和“可执行命令”不是同一个概念。', '实际可安装版本以自己的仓库索引为准，网页列表不是本机安装清单。'],
  },
  pacman: {
    title: 'pacman 查询与同步', source: 'Arch 上游手册', url: 'https://man.archlinux.org/man/pacman.8.en',
    summary: '先分清 -Q 本地查询和 -S 同步仓库操作，再看其后的参数。大小写会改变意义，应逐项阅读示例。',
    points: ['-Qi 查询已安装包，-Si 查询仓库包；-Ss 进行包名和描述搜索。', '-Sg 按组列成员，不能把关键词搜索当成完整组枚举。', '-Syu 刷新数据库并整体升级，实际事务需要足够空间和可恢复方案。'],
  },
  pacdiff: {
    title: 'pacdiff 配置文件检查', source: 'Arch 上游手册', url: 'https://man.archlinux.org/man/pacdiff.8.en',
    summary: 'pacdiff 帮助定位和比较升级产生的配置文件。发现 .pacnew 是“需要审查”的信号，不是“马上覆盖旧文件”的指令。',
    points: ['先查有哪些文件，再比较新增默认项和本机必要配置。', '.pacnew 与 .pacsave 的成因不同，合并前核对 pacman 记录。', '维护后验证服务；合并工具不能自动判断业务所需的每项设置。'],
  },
}

export function sources(...ids) {
  return ids.map(id => ({ ...readingSources[id], reviewedAt: COURSE_REVIEWED_AT }))
}
