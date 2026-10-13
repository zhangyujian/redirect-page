import { pentooPackageEntries, pentooDistroEntries, pentooServiceEntries } from './pentooCommandEntries.js'

export const COMMAND_REVIEWED_AT = '2026-09-03'

export const COMMAND_SYSTEMS = [
  { id: 'kali', name: 'Kali Linux', shortName: 'Kali', manager: 'APT', update: 'sudo apt update && sudo apt full-upgrade', description: '安全测试与数字取证；不要混入 Debian、Ubuntu 或 Parrot 软件源。', links: [
    { title: 'Kali 完整工具索引', url: 'https://www.kali.org/tools/all-tools/' },
    { title: 'Kali 系统更新说明', url: 'https://www.kali.org/docs/general-use/updating-kali/' },
    { title: 'Kali 元包与工具分类', url: 'https://www.kali.org/docs/general-use/metapackages/' },
  ] },
  { id: 'parrot', name: 'Parrot Security OS', shortName: 'Parrot', manager: 'APT', update: 'sudo parrot-upgrade', description: '安全、隐私与开发工作台；系统整体更新优先使用官方封装命令。', links: [
    { title: 'Parrot 完整工具索引', url: 'https://tools.parrotsec.org/' },
    { title: 'Parrot 软件管理文档', url: 'https://parrotsec.org/docs/configuration/parrot-software-management/' },
    { title: 'Parrot 官方文档与工具', url: 'https://parrotsec.org/docs/' },
    { title: 'Parrot AnonSurf 说明', url: 'https://parrotsec.org/docs/tools/anonsurf/' },
  ] },
  { id: 'blackarch', name: 'BlackArch Linux', shortName: 'BlackArch', manager: 'pacman', update: 'sudo pacman -Syu', description: 'Arch 基础与 BlackArch 工具仓库；避免只刷新索引却不进行完整升级。', links: [
    { title: 'BlackArch 完整工具索引', url: 'https://blackarch.org/tools.html' },
    { title: 'BlackArch 仓库与工具组', url: 'https://blackarch.org/downloads.html' },
    { title: 'pacman 完整参数手册', url: 'https://man.archlinux.org/man/pacman.8.en' },
  ] },
  { id: 'pentoo', name: 'Pentoo Linux', shortName: 'Pentoo', manager: 'Portage / emerge', update: 'emerge -pvuDN @world', description: 'Gentoo 基础与 Pentoo overlay；先预览依赖，再在自有虚拟机审阅实际事务。此处命令只预览，不执行更新。', links: [
    { title: 'Pentoo 官方介绍', url: 'https://pentoo.org/about/' },
    { title: 'Pentoo 常见问题', url: 'https://pentoo.org/faqs/' },
    { title: 'Gentoo emerge 完整手册', url: 'https://dev.gentoo.org/~zmedico/portage/doc/man/emerge.1.html' },
    { title: 'Gentoo 软件包目录', url: 'https://packages.gentoo.org/' },
  ] },
]

export const COMMAND_CATEGORIES = [
  ['help', '帮助与命令发现'], ['files', '文件与目录'], ['text', '文本与搜索'],
  ['users', '用户与权限'], ['process', '进程与性能'], ['services', '服务与日志'],
  ['network', '网络与连接'], ['storage', '磁盘与文件系统'], ['archive', '压缩与备份'],
  ['shell', 'Shell 与脚本'], ['development', '开发与环境'], ['packages', '软件包管理'],
  ['distro', '发行版专属'], ['security', '安全审计与取证'],
].map(([id, label]) => ({ id, label }))

const allSystems = COMMAND_SYSTEMS.map((system) => system.id)
const aptSystems = ['kali', 'parrot']
const archManual = (name, section = 1) => ({ title: `${name}(${section}) 完整手册`, url: `https://man.archlinux.org/man/${name}.${section}.en` })
const debianManual = (pkg, name, section = 8) => ({ title: `${name}(${section}) Debian 手册`, url: `https://manpages.debian.org/stable/${pkg}/${name}.${section}.en.html` })
const kaliTool = (name) => ({ title: `${name} 工具文档`, url: `https://www.kali.org/tools/${name}/` })

// Groups share platform metadata; each command keeps its own usage and warnings.
function group(category, entries, defaults = {}) {
  return entries.map((entry) => ({
    category, distros: allSystems, scope: 'shared', permission: '普通用户',
    availability: '按镜像和已安装软件包提供；找不到命令时先查包管理器。',
    ...defaults, ...entry,
    id: entry.id || entry.command,
    tag: COMMAND_CATEGORIES.find((item) => item.id === category).label,
    source: entry.source || defaults.source || archManual(entry.command.split(' ')[0]),
    options: entry.options.map(([flag, description]) => ({ flag, description })),
    examples: entry.examples.map(([code, explanation]) => ({ code, explanation })),
    example: entry.examples[0][0],
  }))
}

const helpCommands = group('help', [
  { command: 'man', summary: '阅读本机安装版本的手册，查语法、参数、返回值和相关命令。', syntax: 'man [章节] 命令', options: [['1 / 8', '用户命令 / 管理命令章节'], ['-k 关键词', '在手册摘要中检索']], examples: [['man 1 ls', '打开 ls 手册；输入 /pattern 搜索，按 q 退出。']], note: '同名条目可能在多个章节；本机手册比在线最新版更符合当前安装版本。' },
  { command: 'apropos', summary: '不知道命令名时，按英文功能关键词搜索手册摘要。', syntax: 'apropos [选项] 关键词', options: [['-s 1,8', '只查用户和管理命令'], ['-r', '把关键词作为正则表达式']], examples: [['apropos network', '查找网络相关命令及章节号。']], note: '依赖本机 man 数据库；空结果可能是缺少手册或索引未更新。' },
  { command: 'whatis', summary: '快速查看命令的一句话定义和手册章节。', syntax: 'whatis 命令...', options: [['-s 1', '限定章节'], ['-w', '允许通配符匹配名称']], examples: [['whatis ls chmod', '同时查文件列表和权限命令的摘要。']], note: '与 apropos 不同，主要按命令名称匹配。' },
  { command: 'help', summary: '查看 Bash 内建命令，区分 Shell 功能与外部程序。', syntax: 'help [选项] [内建命令]', options: [['-m', '以手册格式显示'], ['-s', '只显示语法']], examples: [['bash -c "help cd"', '即使当前使用 Zsh，也可在 Bash 中查看 cd 帮助。']], note: '这是 Bash 内建命令；不要假设所有 Shell 都提供同名 help。', source: archManual('bash') },
  { command: 'command -v', summary: '确认某个命令是否可用，以及 Shell 会执行哪个路径或内建命令。', syntax: 'command -v 命令', options: [['-v', '显示解析结果'], ['-V', '输出更详细的类型信息']], examples: [['command -v nmap', '有输出说明当前 PATH 或 Shell 能解析 nmap。']], note: '没有输出且退出码非零时，先检查安装情况与 PATH，不要直接下载陌生脚本。', source: archManual('bash') },
  { command: 'type', summary: '查看一个名称是别名、函数、内建命令还是外部文件。', syntax: 'type [选项] 名称', options: [['-a', '列出所有匹配'], ['-t', '仅输出类型；Bash 用法']], examples: [['bash -c "type -a ls"', '检查 Bash 环境中 ls 的解析结果。']], note: '不同 Shell 的选项有差异；示例明确使用 Bash。', source: archManual('bash') },
  { command: 'compgen', summary: '枚举 Bash 可解析的命令，用本机环境补足在线手册的覆盖范围。', syntax: 'compgen -c [前缀]', options: [['-c', '列出命令名称'], ['-b', '仅列出内建命令']], examples: [["bash -lc 'compgen -c | sort -u'", '列出新 Bash 会话发现的命令并去重。']], note: '结果取决于 PATH、已安装软件和 Bash 配置，不包含其他 Shell 独有的函数。', source: archManual('bash') },
  { command: 'info', summary: '阅读 GNU 工具的主题式文档，适合按章节系统学习。', syntax: 'info [主题]', options: [['--apropos=关键词', '搜索文档索引'], ['--where', '显示文档位置']], examples: [['info coreutils', '打开 GNU 核心工具说明；按 q 退出。']], note: '可能需要单独安装 info 和相应文档包。' },
])

const fileCommands = group('files', [
  { command: 'pwd', summary: '输出当前工作目录的绝对路径，执行文件操作前先确认位置。', syntax: 'pwd [-L|-P]', options: [['-P', '解析符号链接后的真实目录'], ['-L', '保留逻辑路径']], examples: [['pwd -P', '确认实际所在目录。']], note: '相对路径以当前目录为起点；路径判断错误会影响复制和删除目标。' },
  { command: 'ls', summary: '列出目录内容，检查隐藏文件、权限、属主和文件大小。', syntax: 'ls [选项] [路径]', options: [['-la', '长格式并包含隐藏文件'], ['-h', '以易读单位显示大小'], ['-t', '按修改时间排序']], examples: [['ls -lah ~/lab', '查看个人实验目录的文件和权限。']], note: 'ls 输出用于阅读；脚本处理特殊文件名时优先使用 find 的零字节分隔。' },
  { command: 'cd', summary: '改变当前 Shell 的工作目录，是组织命令路径的基础。', syntax: 'cd [目录]', options: [['..', '进入父目录'], ['-', '回到上一个目录'], ['~', '进入家目录']], examples: [['cd ~/lab', '进入已存在的个人实验目录。']], note: '这是 Shell 内建命令；路径有空格时加引号。', source: archManual('bash') },
  { command: 'mkdir', summary: '创建目录，用来隔离练习、日志和输出文件。', syntax: 'mkdir [选项] 目录...', options: [['-p', '一并创建缺失的父目录'], ['-m 700', '仅允许属主访问']], examples: [['mkdir -p ~/lab/notes', '创建专用笔记目录。']], note: '已有目录与新建目录权限不一定相同，必要时用 stat 再确认。' },
  { command: 'touch', summary: '创建空文件或更新已有文件的时间戳，不会清空已有内容。', syntax: 'touch [选项] 文件...', options: [['-c', '文件不存在时不创建'], ['-r 文件', '参考另一文件的时间']], examples: [['touch ~/lab/notes.txt', '创建实验记录文件，父目录需先存在。']], note: '取证时修改时间戳会影响证据，应操作副本。' },
  { command: 'cp', summary: '复制文件或目录，常用于修改配置前创建备份。', syntax: 'cp [选项] 源 目标', options: [['-a', '递归复制并尽量保留属性'], ['-i', '覆盖前询问'], ['-v', '显示复制过程']], examples: [['cp -i notes.txt notes.backup.txt', '在当前实验目录备份文件。']], note: '目标存在时可能覆盖；确认源路径和目标路径。', risk: 'write' },
  { command: 'mv', summary: '重命名或移动文件与目录。', syntax: 'mv [选项] 源 目标', options: [['-i', '覆盖前询问'], ['-n', '不覆盖已有目标']], examples: [['mv -i draft.txt notes.txt', '把草稿重命名为笔记。']], note: '移动后原路径不再存在；不同文件系统之间可能变成复制再删除。', risk: 'write' },
  { command: 'rm', summary: '删除文件或目录；不会进入桌面回收站。', syntax: 'rm [选项] 路径...', options: [['-i', '每次删除前确认'], ['-r', '递归删除目录；高风险']], examples: [['rm -i ./practice.tmp', '仅对当前目录的实验文件执行交互式删除。']], note: '先用 pwd 和 ls 确认目标。不要照抄 rm -rf 或针对根目录的通配符。', risk: 'destructive' },
  { command: 'rmdir', summary: '删除空目录，非空时拒绝执行，适合清理练习目录。', syntax: 'rmdir [选项] 目录...', options: [['-p', '同时尝试删除空父目录'], ['-v', '显示处理的目录']], examples: [['rmdir ./empty-lab', '删除明确为空的实验目录。']], note: '不要对不确定的路径使用 -p。', risk: 'write' },
  { command: 'ln', summary: '创建硬链接或符号链接，让同一文件可通过其他路径访问。', syntax: 'ln [选项] 目标 链接名', options: [['-s', '创建符号链接'], ['-i', '覆盖已有链接前询问']], examples: [['ln -s notes.txt notes-link.txt', '在同一目录建立指向笔记的软链接。']], note: '相对软链接的目标相对于链接所在目录；源文件移走后可能失效。' },
  { command: 'stat', summary: '查看文件类型、权限、属主、大小和多种时间戳。', syntax: 'stat [选项] 文件', options: [['-c 格式', '按指定格式输出'], ['-L', '查看链接指向的目标']], examples: [["stat -c '%A %U:%G %s %n' notes.txt", '依次显示权限、属主、字节数与名称。']], note: 'ctime 是元数据变更时间，不等同于创建时间。' },
  { command: 'file', summary: '根据内容特征判断文件类型，而不只依赖扩展名。', syntax: 'file [选项] 文件', options: [['-b', '省略文件名前缀'], ['--mime-type', '显示 MIME 类型']], examples: [['file --mime-type sample.bin', '初步识别实验样本的文件类型。']], note: '识别结果不是安全保证，不要直接运行未知样本。' },
  { command: 'find', summary: '按名称、类型、大小或时间在目录树中定位文件。', syntax: 'find 起始目录 [条件]', options: [['-type f', '只匹配普通文件'], ['-name 模式', '按文件名匹配'], ['-mtime -7', '筛选最近约 7 天修改的文件']], examples: [["find ~/lab -type f -name '*.txt'", '只读查找实验目录内的文本文件。']], note: '模式要加引号；初学时不要加 -delete 或未知的 -exec。' },
  { command: 'locate', summary: '使用预建数据库快速按路径搜索文件。', syntax: 'locate [选项] 模式', options: [['-i', '忽略大小写'], ['-e', '只显示仍存在的文件']], examples: [['locate -i nmap', '快速定位数据库中包含 nmap 的路径。']], note: '不同系统可能使用 plocate；结果可能滞后，必要时由管理员更新数据库。', source: archManual('plocate') },
  { command: 'realpath', summary: '解析相对路径和符号链接，得到规范的绝对路径。', syntax: 'realpath [选项] 路径', options: [['-e', '要求所有路径组件存在'], ['--relative-to=目录', '输出相对于指定目录的路径']], examples: [['realpath -e ./notes.txt', '在操作前核对笔记文件的真实位置。']], note: '解析成功并不代表拥有读写权限。' },
  { command: 'tree', summary: '以树状结构查看目录层级，适合整理实验成果。', syntax: 'tree [选项] [目录]', options: [['-L 2', '只展示两层'], ['-a', '包括隐藏文件']], examples: [['tree -L 2 ~/lab', '查看工作区结构而不展开过多层级。']], note: '可能需要安装 tree；不要分享包含敏感目录名的输出。' },
])

const textCommands = group('text', [
  { command: 'cat', summary: '输出或串联小型文本文件的内容。', syntax: 'cat [选项] 文件...', options: [['-n', '为所有行编号'], ['-A', '显示不可见字符']], examples: [['cat -n notes.txt', '按行号阅读实验笔记。']], note: '不要用 cat 输出二进制或私钥；大文件使用 less。' },
  { command: 'less', summary: '分页浏览文件，可搜索关键词，不必一次加载到终端。', syntax: 'less [选项] 文件', options: [['-N', '显示行号'], ['-S', '长行不折行，左右滚动']], examples: [['less -N app.log', '使用 /error 搜索，n 跳下一个匹配，q 退出。']], note: 'less 的 q、/ 和 n 是交互按键，不是命令行参数。' },
  { command: 'head', summary: '查看文件开头，用于确认格式、表头或样本内容。', syntax: 'head [选项] 文件', options: [['-n 数量', '指定行数'], ['-c 数量', '指定字节数']], examples: [['head -n 20 app.log', '查看前 20 行日志。']], note: '日志可能包含身份信息，复制输出前检查。' },
  { command: 'tail', summary: '读取文件末尾或持续查看新追加的日志。', syntax: 'tail [选项] 文件', options: [['-n 数量', '指定末尾行数'], ['-F', '持续跟踪并适应文件轮转']], examples: [['tail -n 50 app.log', '检查最新 50 行。']], note: '持续跟踪时按 Ctrl+C 停止；systemd 日志可用 journalctl。' },
  { command: 'grep', summary: '按文本或正则表达式查找匹配行，常用于日志定位。', syntax: 'grep [选项] 模式 [文件]', options: [['-n', '显示行号'], ['-i', '忽略大小写'], ['-E', '使用扩展正则']], examples: [["grep -ni 'error' app.log", '找出包含 error 的行及位置。']], note: '正则含 Shell 特殊字符时加引号；退出码 1 表示无匹配，不一定是故障。' },
  { command: 'rg', summary: 'ripgrep 递归搜索项目文本，默认尊重忽略规则。', syntax: 'rg [选项] 模式 [路径]', options: [['-n', '显示行号'], ['-g 通配符', '限定文件'], ['--hidden', '包含隐藏路径']], examples: [["rg -n -g '*.log' 'error' ~/lab", '仅搜索实验目录的日志文件。']], note: '可能需安装 ripgrep；默认忽略规则会影响结果。', source: archManual('rg') },
  { command: 'sed', summary: '对文本逐行筛选或替换，适合预览批量修改。', syntax: 'sed [选项] 脚本 [文件]', options: [['-n', '取消自动输出'], ['-E', '扩展正则'], ['-i', '原地修改；使用前备份']], examples: [["sed -n '1,20p' notes.txt", '只读显示第 1 至 20 行。']], note: '先不带 -i 预览结果；不同实现的备份参数有差异。' },
  { command: 'awk', summary: '按字段处理文本，筛选记录或统计数据。', syntax: 'awk [选项] 程序 [文件]', options: [['-F 分隔符', '指定字段分隔符'], ['-v 变量=值', '向程序传入变量']], examples: [["awk -F: '{print $1}' /etc/passwd", '只读输出本机账户名称字段。']], note: '复杂 CSV 的引号与转义应交给专用解析器处理。' },
  { command: 'sort', summary: '对文本行排序，可按数值、字段或反向排列。', syntax: 'sort [选项] [文件]', options: [['-n', '按数字大小排序'], ['-r', '逆序'], ['-u', '排序后去重']], examples: [['sort -u hosts.txt', '生成去重的主机列表输出，不改原文件。']], note: '排序受 locale 影响；需要可复现字节顺序时设置 LC_ALL=C。' },
  { command: 'uniq', summary: '合并相邻重复行，可统计重复次数。', syntax: 'uniq [选项] [文件]', options: [['-c', '统计出现次数'], ['-d', '仅显示重复行']], examples: [['sort hosts.txt | uniq -c', '先排序，再统计每一行出现次数。']], note: '不相邻的重复项不会自动合并，因此常与 sort 配合。' },
  { command: 'wc', summary: '统计文件的行数、单词数或字节数。', syntax: 'wc [选项] [文件]', options: [['-l', '换行符数量'], ['-w', '单词数量'], ['-c', '字节数']], examples: [['wc -l app.log', '估算日志记录行数。']], note: '-l 统计换行符；末尾未换行的内容可能使结果与视觉行数不同。' },
  { command: 'cut', summary: '按分隔符或位置提取字段。', syntax: 'cut [选项] [文件]', options: [['-d 分隔符', '指定单字符分隔符'], ['-f 字段', '选择字段号']], examples: [["cut -d: -f1 /etc/passwd", '提取账户列表第一列。']], note: '连续空格和带引号 CSV 不适合用简单 cut 处理。' },
  { command: 'tee', summary: '把标准输入同时显示到终端并写入文件。', syntax: 'tee [选项] [文件]', options: [['-a', '追加而不是覆盖'], ['-i', '忽略中断信号']], examples: [['date | tee -a study.log', '把当前时间追加到学习日志并显示。']], note: '默认覆盖文件；涉及系统路径时还需检查权限。', risk: 'write' },
  { command: 'diff', summary: '逐行比较两个文本文件的差异。', syntax: 'diff [选项] 文件1 文件2', options: [['-u', '统一差异格式'], ['-r', '递归比较目录']], examples: [['diff -u config.before config.after', '检查配置变更内容。']], note: '退出码 1 表示存在差异，2 通常表示错误。' },
  { command: 'jq', summary: '按结构读取和转换 JSON，避免依赖字符串切割。', syntax: 'jq [选项] 过滤器 [文件]', options: [['-r', '输出原始字符串'], ['-e', '根据结果设置退出码']], examples: [["jq '.items[] | .name' data.json", '假设 items 为数组，逐条提取 name 字段。']], note: '过滤器需匹配实际 JSON 结构；查看全部内容可用 jq . data.json。' },
])

const userCommands = group('users', [
  { command: 'whoami', summary: '显示当前有效用户名称，确认命令以谁的权限运行。', syntax: 'whoami', options: [['--help', '查看帮助']], examples: [['whoami', 'sudo 或切换用户后核对身份。']], note: '不显示所有组信息；组和 UID 用 id 查看。' },
  { command: 'id', summary: '显示用户 UID、主组 GID 和附加组。', syntax: 'id [选项] [用户名]', options: [['-u', '仅显示 UID'], ['-Gn', '显示全部组名']], examples: [['id', '核对当前用户身份和组成员资格。']], note: '添加附加组后往往需要重新登录才会更新当前会话。' },
  { command: 'sudo', summary: '按管理员配置的策略，以其他用户身份执行单条命令。', syntax: 'sudo [选项] 命令', options: [['-l', '列出被允许的命令'], ['-u 用户', '指定目标用户'], ['-k', '使缓存的认证失效']], examples: [['sudo -l', '先检查自己获准执行哪些管理命令。']], note: '只为确实需要的命令提权；不要长期使用 root Shell 或对陌生脚本提权。', permission: '需 sudo 授权' },
  { command: 'chmod', summary: '修改文件或目录的读、写、执行权限。', syntax: 'chmod [选项] 模式 路径', options: [['u+x', '给属主增加执行权限'], ['640', '属主读写、同组只读、其他无权限'], ['-R', '递归修改；谨慎使用']], examples: [['chmod 640 notes.txt', '收紧单个笔记文件的访问权限。']], note: '目录的 x 表示可进入；不要为解决权限问题直接使用 777。', risk: 'write' },
  { command: 'chown', summary: '改变文件的所有者及所属组。', syntax: 'chown [选项] 用户[:组] 路径', options: [['--reference=文件', '参考已有文件的属主'], ['-R', '递归处理目录']], examples: [['sudo chown "$USER" ./notes.txt', '把实验文件属主设为当前用户。']], note: '仅限已确认的实验文件；递归操作系统目录可能导致服务无法启动。', permission: '更改属主通常需 sudo', risk: 'write' },
  { command: 'umask', summary: '控制新建文件与目录默认权限中被屏蔽的部分。', syntax: 'umask [模式]', options: [['-S', '用符号形式显示'], ['077', '仅让属主获得默认访问权限']], examples: [['umask', '只读查看当前 Shell 的权限掩码。']], note: '只影响之后创建的对象，不会修复已有文件权限；Bash/Zsh 都有内建实现。', source: archManual('bash') },
  { command: 'passwd', summary: '交互式修改账户密码或查看密码状态。', syntax: 'passwd [选项] [用户名]', options: [['-S', '查看密码状态'], ['-l', '锁定密码登录；管理员操作']], examples: [['passwd', '在交互提示中修改自己的密码。']], note: '不要把密码写在命令行、笔记或截图里；锁定密码不等于禁用所有认证方式。', risk: 'write' },
  { command: 'useradd', summary: '创建实验账户，设置家目录和登录 Shell。', syntax: 'useradd [选项] 用户名', options: [['-m', '创建家目录'], ['-s 路径', '指定登录 Shell']], examples: [['sudo useradd -m -s /bin/bash labuser', '只在自有实验虚拟机创建专用账户。']], note: '需另行设置凭据和所需权限；不要默认赋予管理员组。', permission: '需 sudo', risk: 'write', source: archManual('useradd', 8) },
  { command: 'usermod', summary: '修改已有账户的附加组、Shell 等属性。', syntax: 'usermod [选项] 用户名', options: [['-aG 组', '追加附加组'], ['-s 路径', '修改登录 Shell']], examples: [['sudo usermod -aG labgroup labuser', '先创建 labgroup，再把实验账户追加进该组。']], note: '只用 -G 会替换附加组列表；docker 等组通常具有很高权限。', permission: '需 sudo', risk: 'write', source: archManual('usermod', 8) },
  { command: 'getfacl', summary: '查看超出传统属主/组权限的 ACL 访问规则。', syntax: 'getfacl [选项] 路径', options: [['-p', '保留绝对路径'], ['-R', '递归显示']], examples: [['getfacl ./notes.txt', '排查为什么某个用户能访问文件。']], note: 'ACL 需要文件系统支持；没有输出扩展条目可能表示只使用普通权限。' },
  { command: 'setfacl', summary: '为指定用户或组配置细粒度文件访问权限。', syntax: 'setfacl [选项] 路径', options: [['-m 规则', '修改或添加 ACL'], ['-x 规则', '移除特定 ACL']], examples: [['setfacl -m u:labuser:r ./notes.txt', '给已存在的 labuser 添加文件只读权限。']], note: '先用 getfacl 留存旧设置，并检查 ACL mask 对有效权限的影响。', risk: 'write' },
])

const processCommands = group('process', [
  { command: 'ps', summary: '获取某一时刻的进程列表，查看 PID、用户和启动命令。', syntax: 'ps [选项]', options: [['aux', 'BSD 风格，显示所有进程'], ['-p PID', '选择特定进程'], ['-o 字段', '定制输出列']], examples: [['ps -eo pid,ppid,user,comm', '用结构清楚的列查看进程及父进程。']], note: '参数可能包含敏感信息，分享完整 args 前检查。' },
  { command: 'top', summary: '实时查看 CPU、内存占用和进程活动。', syntax: 'top [选项]', options: [['-p PID', '只观察某进程'], ['-b -n 1', '输出一次非交互快照']], examples: [['top -b -n 1', '生成一次系统性能快照。']], note: 'CPU 的高占用不一定是故障；结合持续时间和工作负载判断。' },
  { command: 'htop', summary: '用交互界面查看和筛选进程，辅助性能排查。', syntax: 'htop [选项]', options: [['-u 用户', '仅显示指定用户'], ['-p PID', '指定进程']], examples: [['htop', '方向键浏览，F10 或 q 退出。']], note: '可能需要安装 htop；界面中的结束进程操作会影响运行中的任务。' },
  { command: 'pgrep', summary: '按进程名或命令行查找 PID，避免误选其他程序。', syntax: 'pgrep [选项] 模式', options: [['-a', '显示完整命令行'], ['-f', '按完整命令行匹配'], ['-u 用户', '限定属主']], examples: [['pgrep -a -u "$USER" bash', '只列出自己名下的 Bash 进程。']], note: '模式默认是正则；结束进程前先用 ps 再确认。' },
  { command: 'kill', summary: '向指定 PID 发送信号，请进程退出或执行其他约定动作。', syntax: 'kill [-信号] PID', options: [['-TERM', '请求正常退出'], ['-l', '列出信号名称']], examples: [['kill -l', '先了解信号列表；不结束任何进程。']], note: '实际使用 kill -TERM PID 前核对目标；-KILL 无法让程序保存数据。', risk: 'write' },
  { command: 'free', summary: '查看内存与交换空间，区分缓存和可用内存。', syntax: 'free [选项]', options: [['-h', '易读单位'], ['-s 秒', '定时刷新']], examples: [['free -h', '优先关注 available，不只看 free 列。']], note: 'Linux 会使用空闲内存缓存文件，缓存并不等于泄漏。' },
  { command: 'uptime', summary: '显示开机时长、登录用户数和近期平均负载。', syntax: 'uptime [选项]', options: [['-p', '易读开机时长'], ['-s', '显示启动时间']], examples: [['uptime', '查看 1、5、15 分钟平均负载。']], note: '负载不是 CPU 使用百分比，需要结合 CPU 核数和 I/O 等待判断。' },
  { command: 'lsof', summary: '把文件、端口与正在使用它们的进程关联起来。', syntax: 'lsof [选项] [路径]', options: [['-i :端口', '筛选网络端口'], ['-p PID', '筛选进程'], ['-nP', '不解析地址和端口名称']], examples: [['lsof -nP -i :8080', '检查谁占用了本机 8080 端口。']], note: '其他用户的进程详情可能需要管理员权限；查询本身不停止服务。' },
  { command: 'vmstat', summary: '观察运行队列、内存、换页和 CPU 的变化趋势。', syntax: 'vmstat [间隔秒] [次数]', options: [['1 5', '每秒采样，共 5 次'], ['-s', '显示内存统计汇总']], examples: [['vmstat 1 5', '连续观察 5 次，而不是只看瞬时值。']], note: '第一行通常是自启动以来的平均统计，后续行才是采样区间。', source: archManual('vmstat', 8) },
])

const serviceCommands = group('services', [
  { command: 'systemctl status', summary: '查看 systemd 服务状态、最近日志和进程信息。', syntax: 'systemctl status [服务]', options: [['--no-pager', '直接输出'], ['--full', '避免截断单元名称']], examples: [['systemctl status --no-pager', '查看本机服务管理器的整体状态。']], note: '容器或未启用 systemd 的 WSL 中可能不可用；SSH 单元名也会因发行版不同而不同。' },
  { command: 'systemctl list-units', summary: '按类型或状态列出当前载入的服务单元。', syntax: 'systemctl list-units [选项]', options: [['--type=service', '仅服务单元'], ['--state=running', '只列正在运行的服务'], ['--failed', '只列失败单元']], examples: [['systemctl list-units --type=service --state=running', '盘点当前运行服务，作为暴露面审计起点。']], note: '载入单元不等于全部已安装单元；后者使用 list-unit-files。' },
  { command: 'systemctl list-unit-files', summary: '查看已安装单元文件及其开机启用状态。', syntax: 'systemctl list-unit-files [选项]', options: [['--type=service', '仅服务'], ['--state=enabled', '筛选已启用单元']], examples: [['systemctl list-unit-files --type=service', '检查服务是否配置为开机启动。']], note: 'enabled 不代表此刻正在运行，须与 status 对照。' },
  { command: 'systemctl restart', summary: '停止后重新启动指定服务，让服务重新读取配置。', syntax: 'sudo systemctl restart 服务', options: [['--user', '操作用户级服务'], ['--no-block', '发起任务后不等待完成']], examples: [['systemctl --user restart lab-demo.service', '仅重启事先创建的个人实验服务。']], note: '先验证配置；重启 SSH、网络或防火墙可能断开当前连接。', permission: '系统服务需 sudo', risk: 'write' },
  { command: 'systemctl enable', summary: '配置单元自动启动；单独 enable 不会立即启动服务。', syntax: 'sudo systemctl enable [选项] 服务', options: [['--now', '同时立即启动'], ['--user', '用户级单元']], examples: [['systemctl --user enable lab-demo.service', '为已有个人实验服务配置自动启动。']], note: '仅对确实需要的服务操作；使用 disable 撤销启用不一定会停止正在运行的服务。', permission: '系统服务需 sudo', risk: 'write' },
  { command: 'journalctl', summary: '按启动、时间、服务或优先级查询 systemd 日志。', syntax: 'journalctl [选项]', options: [['-b', '当前启动周期'], ['-u 服务', '限定单元'], ['-p warning', '警告及更严重日志'], ['-f', '持续跟踪']], examples: [['journalctl -b -p warning --no-pager', '定位这次开机后的重要警告。']], note: '日志可能包含身份信息；更多系统日志可能需 sudo 或日志读取组权限。' },
  { command: 'dmesg', summary: '查看内核消息，排查驱动、磁盘和硬件问题。', syntax: 'dmesg [选项]', options: [['--level=err,warn', '仅错误和警告'], ['-T', '用易读时间显示']], examples: [['sudo dmesg --level=err,warn', '只读查看内核异常，不清空缓冲区。']], note: '-T 的时间在休眠等情况下可能不精确；不要用清空日志选项破坏排查线索。', permission: '受内核限制时需 sudo', source: archManual('dmesg') },
  { command: 'crontab', summary: '管理当前用户的周期任务。', syntax: 'crontab [选项]', options: [['-l', '列出已有任务'], ['-e', '编辑任务表']], examples: [['crontab -l', '只读检查当前用户的计划任务。']], note: 'cron/cronie 需要安装并运行；不要误用 -r 删除全部任务，自动任务应使用绝对路径。' },
  { command: 'hostnamectl', summary: '查看主机名、操作系统和内核等基本信息。', syntax: 'hostnamectl [命令]', options: [['status', '查看当前设置'], ['set-hostname 名称', '更改主机名']], examples: [['hostnamectl status', '确认当前实验系统的基本身份信息。']], note: 'set-hostname 会修改配置且通常需要管理员权限；容器环境信息可能不同。' },
  { command: 'timedatectl', summary: '检查系统时区、当前时间和网络时间同步状态。', syntax: 'timedatectl [命令]', options: [['status', '显示时间配置'], ['list-timezones', '列出可用时区']], examples: [['timedatectl status', '在分析跨主机日志前核对时间与时区。']], note: '修改系统时间可能影响证书、认证和日志关联；先确认授时配置。' },
])

const networkCommands = group('network', [
  { command: 'ip', summary: '查看网络接口、IP 地址、路由及邻居表。', syntax: 'ip [选项] 对象 命令', options: [['-br address', '简洁显示地址'], ['route show', '显示路由表'], ['link show', '显示接口状态']], examples: [['ip -br address', '找出实际网卡名称及其 IP 地址。']], note: 'addr add、route del、link set 会改变网络；先从 show 开始。', source: archManual('ip', 8) },
  { command: 'ss', summary: '查看套接字与监听端口，判断服务绑定在本机还是所有网卡。', syntax: 'ss [选项]', options: [['-tuln', 'TCP/UDP 监听端口且不解析名称'], ['-p', '显示关联进程'], ['-a', '包含非监听连接']], examples: [['ss -tulpn', '区分 127.0.0.1、0.0.0.0 和具体实验地址。']], note: '查看其他用户进程可能需 sudo；监听端口不等于公网实际可达。', source: archManual('ss', 8) },
  { command: 'ping', summary: '发送有限次 ICMP 请求，检查基本网络连通性。', syntax: 'ping [选项] 主机', options: [['-c 次数', '限制请求数量'], ['-W 秒', '设置响应等待时间']], examples: [['ping -c 4 127.0.0.1', '先测试本机回环接口。']], note: '不响应可能是防火墙禁止 ICMP，不代表主机离线；不要使用泛洪选项。' },
  { command: 'tracepath', summary: '观察到目标的路由路径和路径 MTU。', syntax: 'tracepath [选项] 主机', options: [['-n', '只显示地址'], ['-m 跳数', '限制最大跳数']], examples: [['tracepath -n 192.168.56.1', '在自己的实验网络观察路由跳转。']], note: '探测会产生网络流量；某些网关不会回复。' },
  { command: 'dig', summary: '查询 DNS 记录，区分解析、服务可达性和应用故障。', syntax: 'dig [@DNS服务器] 域名 [类型]', options: [['+short', '简短结果'], ['A / AAAA / MX', 'IPv4 / IPv6 / 邮件记录']], examples: [['dig example.com A +short', '向当前配置的 DNS 查询示例域名 IPv4 记录。']], note: '查询会发送到 DNS 服务器；包名通常是 dnsutils 或 bind。' },
  { command: 'host', summary: '以较简洁的方式查询域名或反向解析地址。', syntax: 'host [选项] 域名 [服务器]', options: [['-t 类型', '指定记录类型'], ['-v', '显示详细信息']], examples: [['host -t AAAA example.com', '查询示例域名的 IPv6 记录。']], note: 'DNS 结果可能受缓存和解析器影响。' },
  { command: 'curl', summary: '发起网络请求并查看响应，适合 HTTP 和接口排查。', syntax: 'curl [选项] URL', options: [['-I', '只请求响应头'], ['-L', '跟随重定向'], ['--max-time 秒', '限制请求总时长']], examples: [['curl -I --max-time 10 https://example.com', '检查示例站点响应头并保留 TLS 验证。']], note: '不要为绕过证书错误常态使用 -k；不要把访问令牌直接写入公开笔记。' },
  { command: 'wget', summary: '下载文件并保存到本地，适合获取公开文档。', syntax: 'wget [选项] URL', options: [['-O 文件', '指定输出文件'], ['-c', '尝试续传'], ['--timeout=秒', '设置网络超时']], examples: [['wget -O example.html https://example.com', '把示例页面保存到当前实验目录。']], note: '-O 会覆盖目标；下载程序后先校验来源和校验值，不要直接执行。', risk: 'write' },
  { command: 'ssh', summary: '使用加密连接登录获授权的远程主机。', syntax: 'ssh [选项] 用户@主机', options: [['-p 端口', '指定 SSH 端口'], ['-i 文件', '指定身份密钥'], ['-v', '输出连接诊断信息']], examples: [['ssh labuser@192.168.56.101', '登录自有实验虚拟机，首次连接核对主机指纹。']], note: '不要关闭主机密钥检查，也不要把私钥分享给他人。' },
  { command: 'scp', summary: '通过 SSH 在本地和授权远程主机之间复制文件。', syntax: 'scp [选项] 源 目标', options: [['-P 端口', '指定 SSH 端口；大写 P'], ['-r', '递归复制目录']], examples: [['scp notes.txt labuser@192.168.56.101:~/notes.txt', '向个人实验机传送笔记。']], note: '可能覆盖远端文件；现代 OpenSSH 默认使用 SFTP 传输协议。', risk: 'write' },
  { command: 'ssh-keygen', summary: '创建或检查 SSH 密钥，用于安全认证。', syntax: 'ssh-keygen [选项]', options: [['-t ed25519', '选择 Ed25519 类型'], ['-l -f 文件', '显示公钥指纹']], examples: [['ssh-keygen -l -f ~/.ssh/id_ed25519.pub', '只读查看已有公钥指纹。']], note: '生成新密钥前检查目标文件是否存在；私钥设置口令并妥善保管。' },
  { command: 'nmcli', summary: '通过 NetworkManager 查看和管理网络连接。', syntax: 'nmcli [对象] [命令]', options: [['device status', '设备状态'], ['connection show', '已保存连接'], ['general status', '总体状态']], examples: [['nmcli device status', '查看接口是否由 NetworkManager 管理。']], note: '部分最小系统不使用 NetworkManager；改变连接可能导致远程会话断开。' },
  { command: 'ncat', summary: '用 TCP/UDP 客户端检查自有服务端口，辅助理解协议连接。', syntax: 'ncat [选项] 主机 端口', options: [['-z', '零数据连接检查'], ['-v', '详细连接信息'], ['-w 秒', '设置连接超时']], examples: [['ncat -z -v -w 2 127.0.0.1 8080', '检测本机实验服务是否接受 TCP 连接。']], note: 'ncat、OpenBSD nc 和传统 netcat 不是完全相同的实现，不要混用参数。', source: { title: 'Ncat 官方参考', url: 'https://nmap.org/ncat/guide/ncat-man.html' } },
])

const storageCommands = group('storage', [
  { command: 'lsblk', summary: '以设备树显示磁盘、分区、文件系统和挂载点。', syntax: 'lsblk [选项]', options: [['-f', '文件系统与 UUID'], ['-o 列表', '指定输出列']], examples: [['lsblk -f', '在挂载或镜像操作前识别设备。']], note: '设备名称可能随重启变化；不要仅凭 /dev/sdb 判断哪块磁盘。', source: archManual('lsblk', 8) },
  { command: 'df', summary: '查看已挂载文件系统的空间使用情况。', syntax: 'df [选项] [路径]', options: [['-h', '易读容量'], ['-i', 'inode 使用情况'], ['-T', '文件系统类型']], examples: [['df -hT', '检查磁盘是否满以及各挂载点类型。']], note: '空间充足但 inode 耗尽也会导致无法新建文件。' },
  { command: 'du', summary: '统计目录及文件实际占用空间，定位大目录。', syntax: 'du [选项] 路径', options: [['-h', '易读单位'], ['-s', '只显示总计'], ['--max-depth=1', '仅展开一层']], examples: [['du -h --max-depth=1 ~/lab', '查找实验目录中的空间占用。']], note: '符号链接、稀疏文件和权限会影响统计，与 df 结果不一定一致。' },
  { command: 'findmnt', summary: '查询当前挂载表，检查某路径属于哪个文件系统。', syntax: 'findmnt [选项] [挂载点]', options: [['-T 路径', '查路径所属挂载点'], ['-o 列表', '选择输出字段']], examples: [['findmnt -T ~/lab', '确认实验目录实际所在磁盘和挂载选项。']], note: '查询不修改挂载状态。', source: archManual('findmnt', 8) },
  { command: 'mount', summary: '把文件系统接入目录树，读取磁盘或镜像。', syntax: 'mount [选项] 设备或镜像 挂载点', options: [['-o ro', '请求只读挂载'], ['-o loop', '将文件作为块设备使用']], examples: [['sudo mount -o loop,ro lab.iso /mnt/lab', '先准备挂载点，再只读挂载可信实验 ISO。']], note: '不要随意挂载不可信文件系统；严谨取证还需防写措施与原件保护。', permission: '通常需 sudo', risk: 'write', source: archManual('mount', 8) },
  { command: 'umount', summary: '卸载文件系统，让缓存数据落盘后再移除设备。', syntax: 'umount 挂载点', options: [['-v', '显示过程'], ['--all-targets', '高级用法，处理同设备其他挂载点']], examples: [['sudo umount /mnt/lab', '完成实验后卸载指定挂载点。']], note: '提示忙时先退出该目录并检查 lsof，不要直接拔盘或盲目强制卸载。', permission: '通常需 sudo', risk: 'write', source: archManual('umount', 8) },
  { command: 'blkid', summary: '读取块设备的 UUID、标签和文件系统类型。', syntax: 'blkid [选项] [设备]', options: [['-o list', '用列表显示'], ['-s UUID', '只显示 UUID 标签']], examples: [['sudo blkid', '只读识别设备标识，为检查挂载配置提供依据。']], note: '普通用户可能只能看到缓存信息。', permission: '完整扫描需 sudo', source: archManual('blkid', 8) },
  { command: 'fdisk', summary: '查看分区布局，也能交互修改分区表。', syntax: 'fdisk [选项] [设备]', options: [['-l', '只列出分区'], ['-o 列名', '指定列表输出列；用 --help 查看支持的列名']], examples: [['sudo fdisk -l', '只读盘点分区，避免进入写入流程。']], note: '修改分区表可能导致数据丢失；练习前备份，绝不要对系统盘试写。', permission: '完整读取需 sudo', risk: 'destructive', source: archManual('fdisk', 8) },
])

const archiveCommands = group('archive', [
  { command: 'tar', summary: '将多个文件归档，或列出、解开已有归档。', syntax: 'tar [操作与选项] 归档 [文件]', options: [['-c / -x / -t', '创建 / 解包 / 列表'], ['-f 文件', '指定归档'], ['-z', '使用 gzip']], examples: [['tar -tzf lab-backup.tar.gz', '解压前先查看归档内的路径。'], ['tar -czf lab-backup.tar.gz lab/', '在 lab 目录外创建压缩备份。']], note: '在独立目录解压未知归档；防止意外覆盖，不要以 root 解压不可信内容。', risk: 'write' },
  { command: 'gzip', summary: '压缩单个文件，配套 gunzip 解压。', syntax: 'gzip [选项] 文件', options: [['-k', '保留源文件'], ['-d', '解压'], ['-t', '检查压缩数据完整性']], examples: [['gzip -k notes.txt', '生成 notes.txt.gz 并保留原文件。']], note: '默认通常替换源文件；需要保留时显式使用 -k。', risk: 'write' },
  { command: 'xz', summary: '压缩单个文件，常用于软件归档和镜像分发。', syntax: 'xz [选项] 文件', options: [['-k', '保留输入文件'], ['-d', '解压'], ['-T 数量', '设置工作线程数量']], examples: [['xz -k notes.txt', '保留笔记并创建 xz 压缩副本。']], note: '压缩可能占用较多内存；先检查空间和硬件资源。', risk: 'write' },
  { command: 'zip', summary: '创建常见 ZIP 归档，便于跨系统传输。', syntax: 'zip [选项] 归档 文件...', options: [['-r', '递归归档目录'], ['-u', '更新已有归档']], examples: [['zip -r lab-notes.zip lab/notes/', '把实验笔记目录打包。']], note: '不要把密钥、令牌或整个家目录误打包；普通 ZIP 不是保密措施。', risk: 'write' },
  { command: 'unzip', summary: '查看和解压 ZIP 文件。', syntax: 'unzip [选项] 归档', options: [['-l', '只列出内容'], ['-d 目录', '指定解压位置'], ['-n', '不覆盖现有文件']], examples: [['unzip -l lab-notes.zip', '解压前先审查内容与路径。']], note: '解压时使用新的实验目录并关注异常路径。' },
  { command: 'rsync', summary: '按差异同步目录，适合备份和局域网文件传输。', syntax: 'rsync [选项] 源 目标', options: [['-a', '归档模式'], ['-n', '仅预演不改动'], ['-v', '显示过程']], examples: [['rsync -avn ~/lab/ ~/lab-backup/', '先预演备份，检查会复制哪些内容。']], note: '源路径末尾 / 影响目录层级；--delete 会删除目标多余文件，切勿随意添加。' },
])

const shellCommands = group('shell', [
  { command: 'history', summary: '查看当前 Shell 命令历史，复盘操作过程。', syntax: 'history [数量]', options: [['20', '在 Bash 中显示最近 20 条'], ['-a', '将本会话新历史追加到历史文件']], examples: [['history 20', '在 Bash 会话中回看近期操作。']], note: '历史可能包含敏感参数；Bash 与 Zsh 的用法和存储机制有区别。' },
  { command: 'alias', summary: '查看或定义交互式命令别名，减少重复输入。', syntax: 'alias [名称=内容]', options: [['不带参数', '列出当前别名'], ['名称=内容', '创建或替换别名']], examples: [["alias ll='ls -lah'", '为当前 Shell 定义文件列表快捷名。']], note: '修改配置文件前确认使用 Bash 还是 Zsh；别名不能保证脚本中的行为。' },
  { command: 'export', summary: '把变量导出给后续子进程，例如应用配置。', syntax: 'export 名称=值', options: [['-p', '列出导出变量；注意敏感值'], ['-n 名称', 'Bash 中取消导出属性']], examples: [['export LAB_DIR="$HOME/lab"', '设置一个不含秘密的实验路径变量。']], note: '环境变量可能被子进程读取；不要公开含凭据的 env 或 export 输出。' },
  { command: 'printf', summary: '按明确格式输出字符串，适合可控的脚本输出。', syntax: 'printf 格式 [参数...]', options: [['%s', '字符串占位'], ['\\n', '换行转义']], examples: [["printf '%s\\n' '开始学习 Linux'", '用固定格式输出一行文本。']], note: '把用户输入作为参数，不要直接拿它充当格式字符串。' },
  { command: '管道与重定向', summary: '组合多个程序：连接输入输出，分别处理普通输出和错误。', syntax: '命令1 | 命令2；命令 > 文件', options: [['|', '把标准输出交给下个命令'], ['>', '覆盖输出文件'], ['>>', '追加'], ['2>', '重定向错误输出']], examples: [['ls ~/lab | wc -l', '理解管道如何把文本交给下一条命令。']], note: '示例仅用于理解管道，不是处理特殊文件名的可靠文件计数方法；> 会覆盖数据。', source: archManual('bash') },
  { command: 'jobs / fg / bg', summary: '管理当前交互 Shell 启动的前台和后台任务。', syntax: 'jobs；fg %任务号；bg %任务号', options: [['jobs -l', '查看任务号与 PID'], ['fg %1', '任务 1 转为前台'], ['bg %1', '继续已暂停的任务']], examples: [['jobs -l', '查看本会话的任务列表。']], note: '任务号不是 PID；Ctrl+Z 暂停前台进程，Ctrl+C 是请求中断。' },
  { command: 'bash', summary: '执行 Bash 脚本，也可在不执行脚本的情况下检查语法。', syntax: 'bash [选项] [脚本]', options: [['-n', '只进行语法检查'], ['-c 命令', '执行命令字符串'], ['-x', '打印执行跟踪；可能暴露数据']], examples: [['bash -n lab.sh', '对自己的实验脚本做语法检查。']], note: '语法通过不代表安全；先阅读脚本，避免执行不明下载内容。' },
], { source: archManual('bash'), availability: '本节按 Bash 语法说明；Kali 等系统可能默认使用 Zsh，必要时先启动 bash。' })

const developmentCommands = group('development', [
  { command: 'git', summary: '记录代码与文本变更，查看版本历史和差异。', syntax: 'git 子命令 [参数]', options: [['status', '工作区状态'], ['diff', '未暂存差异'], ['log --oneline', '简洁历史']], examples: [['git status --short', '在自己的仓库内只读查看改动。']], note: '不要误提交 .env、私钥、用户数据；reset --hard 会丢弃本地改动。' },
  { command: 'python3 -m venv', summary: '为项目建立独立的 Python 依赖环境。', syntax: 'python3 -m venv 目录', options: [['.venv', '常用的环境目录名'], ['--help', '查看 venv 选项']], examples: [['python3 -m venv .venv', '在实验项目中创建虚拟环境。']], note: 'Bash/Zsh 可用 source .venv/bin/activate 激活；Debian 系可能需 python3-venv 包，不要 sudo pip。', source: { title: 'Python venv 官方说明', url: 'https://docs.python.org/3/library/venv.html' }, risk: 'write' },
  { command: 'pipx', summary: '为 Python 命令行应用建立独立环境，减少系统依赖冲突。', syntax: 'pipx 子命令 [包名]', options: [['list', '列出隔离安装的应用'], ['install 包名', '安装可信应用'], ['upgrade 包名', '升级应用']], examples: [['pipx list', '查看已安装应用及其环境。']], note: '用于独立 CLI，不替代项目 venv；先确认包名及来源，避免拼写投毒。', source: { title: 'pipx 命令参考', url: 'https://pipx.pypa.io/stable/docs/' } },
  { command: 'docker', summary: '查看和管理容器，用隔离环境承载实验服务。', syntax: 'docker 子命令 [参数]', options: [['ps -a', '列出包括已停止的容器'], ['images', '查看本地镜像'], ['logs 容器', '查看日志']], examples: [['docker ps -a', '只读查看现有实验容器。']], note: '需要安装并启动引擎；docker 组权限很高，不要给陌生容器特权或挂载宿主根目录。', source: { title: 'Docker CLI 官方参考', url: 'https://docs.docker.com/reference/cli/docker/' } },
  { command: 'make', summary: '按 Makefile 定义执行构建、测试或其他任务。', syntax: 'make [选项] [目标]', options: [['-n', '显示预计执行的命令'], ['-j 数量', '控制并发任务数']], examples: [['make --help', '查看本机 make 的能力。']], note: 'Makefile 可以执行任意命令，甚至解析阶段也可能执行内容；不要对未知项目把 -n 当作安全沙盒。', source: archManual('make') },
])

const aptCommands = group('packages', [
  { command: 'apt update', summary: '刷新当前配置软件源的包索引，不会升级已经安装的软件。', syntax: 'sudo apt update', options: [['update', '同步索引'], ['--help', '查看 APT 帮助']], examples: [['sudo apt update', '安装或升级之前先刷新索引并检查错误。']], note: '遇到签名错误应检查系统时间和官方密钥公告，不要关闭签名验证。', permission: '需 sudo', risk: 'write' },
  { command: 'apt search', summary: '按包名或描述搜索当前系统的软件仓库。', syntax: 'apt search [选项] 关键词', options: [['--names-only', '仅匹配包名称'], ['关键词', '可搜索命令名或功能']], examples: [['apt search --names-only nmap', '确认 nmap 包在当前发行版源中的可用性。']], note: '搜索结果受上次更新索引的时间影响。' },
  { command: 'apt show', summary: '查看包的用途、版本、依赖、下载大小和来源。', syntax: 'apt show [选项] 包名', options: [['-a', '显示所有可用版本'], ['包名', '使用 search 找到的准确包名']], examples: [['apt show nmap', '安装前了解依赖与磁盘需求。']], note: '可用版本不一定是已安装版本，用 apt policy 进一步核对。' },
  { command: 'apt policy', summary: '核对已安装版本、候选版本、源地址与优先级。', syntax: 'apt policy [包名]', options: [['包名', '只检查指定软件'], ['不带包名', '列出源优先级信息']], examples: [['apt policy nmap', '判断将从哪个源安装或更新。']], note: '发现其他发行版源时先审查配置，不要混用 Kali、Parrot、Ubuntu 的包。' },
  { command: 'apt list', summary: '按安装或更新状态列出软件包。', syntax: 'apt list [选项]', options: [['--installed', '已安装软件'], ['--upgradable', '有候选更新的软件']], examples: [['apt list --upgradable', '在更新后预先查看待升级软件。']], note: 'APT 的显示输出面向人阅读，不适合作为稳定脚本接口。' },
  { command: 'apt install', summary: '安装软件并自动解析仓库依赖。', syntax: 'sudo apt install 包名...', options: [['--simulate', '预演事务，不实际安装'], ['--only-upgrade', '只升级已经安装的指定包']], examples: [['apt install --simulate nmap', '先看预计安装与依赖变化。'], ['sudo apt install nmap', '确认后在自己的虚拟机安装。']], note: '先刷新索引并核对事务；不要直接带 -y 跳过检查。', permission: '实际安装需 sudo', risk: 'write' },
  { command: 'apt full-upgrade', summary: '进行可处理依赖替换的完整升级，Kali 滚动更新常用。', syntax: 'sudo apt full-upgrade', options: [['--simulate', '预览新增、升级及移除项'], ['full-upgrade', '允许必要的依赖变更']], examples: [['apt full-upgrade --simulate', '先检查更新计划，特别是被移除的软件。']], note: '先备份/快照并完成 apt update；Parrot 的整体更新优先使用 parrot-upgrade。', permission: '实际升级需 sudo', risk: 'write' },
  { command: 'apt remove / purge', summary: '卸载软件；purge 还删除由包管理器维护的系统配置。', syntax: 'sudo apt remove 包名；sudo apt purge 包名', options: [['remove', '移除程序，通常保留包配置'], ['purge', '移除程序及包配置'], ['--simulate', '预演卸载影响']], examples: [['apt remove --simulate nmap', '先确认不会意外连带移除其他需要的软件。']], note: 'purge 不保证清除用户家目录数据；实际卸载会影响依赖该工具的练习。', permission: '实际卸载需 sudo', risk: 'destructive' },
  { command: 'apt autoremove', summary: '检查并清理被标为自动安装且不再需要的依赖。', syntax: 'sudo apt autoremove', options: [['--simulate', '仅查看待移除项'], ['--purge', '同时清理包配置；谨慎使用']], examples: [['apt autoremove --simulate', '先审查自动清理名单。']], note: '元包变化可能让仍需要的工具被列入清理范围，必须逐项检查。', permission: '实际移除需 sudo', risk: 'destructive' },
  { command: 'dpkg-query', summary: '查询本地 dpkg 数据库，包括已安装包与文件列表。', syntax: 'dpkg-query [选项] 包名', options: [['-W', '包名与版本'], ['-L', '列出包安装的路径']], examples: [['dpkg-query -L nmap', '找到 nmap 包实际安装了哪些文件。']], note: '只查本机已记录的软件包，不搜索网络仓库。', source: debianManual('dpkg', 'dpkg-query', 1) },
  { command: 'dpkg -S', summary: '从文件路径反查本机哪个 Debian 包提供了它。', syntax: 'dpkg -S 路径', options: [['-S 路径', '查找文件归属'], ['-l 模式', '查看本机包状态']], examples: [['dpkg -S /usr/bin/ls', '查明 ls 可执行文件归属。']], note: 'pipx、源码手工安装或容器内文件不一定出现在 dpkg 数据库。', source: debianManual('dpkg', 'dpkg', 1) },
  { command: 'apt-cache depends', summary: '查看候选包依赖，理解元包会引入哪些组件。', syntax: 'apt-cache depends 包名', options: [['depends', '查看正向依赖'], ['rdepends', '查看反向依赖']], examples: [['apt-cache depends nmap', '读取包依赖关系而不安装。']], note: '根据本地索引显示，实际安装事务还要考虑已安装状态与版本约束。', source: debianManual('apt', 'apt-cache') },
], { distros: aptSystems, scope: 'system', source: debianManual('apt', 'apt'), availability: 'Kali / Parrot 的 APT 与 dpkg 工具；不适用于 BlackArch 的系统包管理。' })

const pacmanCommands = group('packages', [
  { command: 'pacman -Syu', summary: '同步仓库索引并对系统进行完整升级。', syntax: 'sudo pacman -Syu [包名]', options: [['-S', '同步仓库事务'], ['-y', '刷新数据库'], ['-u', '升级已安装包']], examples: [['sudo pacman -Syu', '阅读官方更新公告、快照备份后执行完整升级。']], note: '不要把 pacman -Sy 后安装新包当作常规更新；局部升级可能使依赖不一致。', permission: '需 sudo', risk: 'write' },
  { command: 'pacman -Ss', summary: '按关键词搜索已配置仓库的软件包名和描述。', syntax: 'pacman -Ss 关键词', options: [['-s', '搜索包名/描述'], ['-q', '仅显示包名']], examples: [['pacman -Ss nmap', '在 Arch 与已配置 BlackArch 仓库查找 nmap。']], note: '依赖已同步的数据库；工具组成员查询应该使用 -Sg，而不是把 -Ss 当作组枚举。' },
  { command: 'pacman -Si', summary: '查看仓库中软件包的版本、依赖及大小。', syntax: 'pacman -Si 包名', options: [['-i', '显示包信息'], ['-ii', '更多仓库信息']], examples: [['pacman -Si nmap', '安装前了解来源、依赖与大小。']], note: '查看本机安装版本使用 -Qi。' },
  { command: 'pacman -Qi', summary: '读取已安装软件包的详细元数据。', syntax: 'pacman -Qi 包名', options: [['-Q', '查本机数据库'], ['-i', '详细信息']], examples: [['pacman -Qi nmap', '核对本机 Nmap 的安装版本与原因。']], note: '包未安装会报找不到；此时可用 -Si 查仓库版本。' },
  { command: 'pacman -Ql', summary: '列出已安装包拥有的文件路径。', syntax: 'pacman -Ql 包名', options: [['-l', '列出文件'], ['-q', '只输出路径']], examples: [['pacman -Ql nmap', '查看可执行文件、脚本和文档的位置。']], note: '不列出程序运行时新生成的用户文件。' },
  { command: 'pacman -Qo', summary: '根据本机文件路径反查所属软件包。', syntax: 'pacman -Qo 路径', options: [['-o', '查询文件归属'], ['-q', '仅输出包名']], examples: [['pacman -Qo /usr/bin/ls', '识别提供 ls 的核心包。']], note: '手工安装文件可能不属于任何 pacman 包。' },
  { command: 'pacman -Qdt', summary: '列出作为依赖安装、目前不再被需要的孤立软件包。', syntax: 'pacman -Qdt', options: [['-d', '只查依赖安装包'], ['-t', '不再被依赖的包'], ['-q', '仅包名']], examples: [['pacman -Qdt', '只读检查可能的清理对象。']], note: '不要把结果直接通过命令替换交给删除操作；逐一确认仍有无用途。' },
  { command: 'pacman -Qm', summary: '列出不在当前同步仓库数据库中的已安装包。', syntax: 'pacman -Qm', options: [['-m', '外部包'], ['-q', '只列包名']], examples: [['pacman -Qm', '检查手工包或 AUR 包的维护情况。']], note: '不在仓库中并不自动意味着恶意，但需要自行跟进来源与更新。' },
  { command: 'pacman -Sg', summary: '列出仓库工具组，或指定组中包含的软件包。', syntax: 'pacman -Sg [组名]', options: [['不带组名', '列出全部组'], ['组名', '枚举该组成员']], examples: [['pacman -Sg blackarch-forensic', '准确列出 BlackArch 取证组成员。']], note: '需事先配置官方 BlackArch 仓库；工具组不是独立可执行命令。' },
  { command: 'pacman -Sl', summary: '列出某个仓库数据库中的全部软件包。', syntax: 'pacman -Sl [仓库名]', options: [['blackarch', '指定 BlackArch 仓库'], ['-q', '只显示软件包名']], examples: [['pacman -Sl blackarch', '从自己的仓库数据库获得完整工具包名单。']], note: '结果以本地数据库为准，列表很长，可接入 less 浏览。' },
  { command: 'pacman -Syu --needed', summary: '完整同步升级的同时安装指定包，跳过相同版本的重装。', syntax: 'sudo pacman -Syu --needed 包名', options: [['--needed', '无需更新时不重装'], ['包名', '使用查询得到的准确名称']], examples: [['sudo pacman -Syu --needed nmap', '在完整升级流程中安装实验需要的 Nmap。']], note: '先审查整体事务，不要使用 --overwrite=* 来掩盖未查明的文件冲突。', permission: '需 sudo', risk: 'write' },
  { command: 'pacman -Rns', summary: '卸载包及不再需要的依赖，并影响配置备份保留行为。', syntax: 'sudo pacman -Rns 包名', options: [['-R', '删除包'], ['-s', '连同符合条件的依赖'], ['-n', '不保留被移除包的配置备份']], examples: [['pacman -Rns --print nmap', '打印预计移除的包，实际删除前核对。']], note: '不要移除关键元包、内核或包管理器。需要保留配置备份时不要添加 -n。', permission: '实际删除需 sudo', risk: 'destructive' },
  { command: 'pacman -Qk', summary: '检查已安装包的文件是否存在，辅助定位损坏或误删。', syntax: 'pacman -Qk [包名]', options: [['-k', '检查文件存在性'], ['-kk', '执行更详细的属性检查']], examples: [['pacman -Qk nmap', '检查包拥有的文件是否缺失。']], note: '不是完整恶意软件扫描；异常可能是合法配置变更，需要结合上下文。' },
  { command: 'pacman-key', summary: '检查 pacman 使用的签名公钥，维护包来源信任。', syntax: 'pacman-key [选项]', options: [['--list-keys', '列出公钥'], ['--finger 指纹', '核对指纹']], examples: [['sudo pacman-key --list-keys', '只读查看包签名密钥环。']], note: '只按官方指引维护密钥；不要关闭 SigLevel，也不要盲目信任陌生签名。', permission: '通常需 sudo', source: archManual('pacman-key', 8) },
], { distros: ['blackarch'], scope: 'system', source: archManual('pacman', 8), availability: 'Arch / BlackArch 的 pacman；BlackArch 工具组需先正确配置官方仓库。' })

const distroCommands = [
  ...group('distro', [
    { command: 'kali-tweaks', summary: '通过 Kali 交互菜单调整工具元包和系统集成设置。', syntax: 'kali-tweaks', options: [['Metapackages', '菜单项：按工具组选择组件'], ['--help', '查看启动参数']], examples: [['kali-tweaks', '打开菜单并先阅读各项说明，不代表已应用更改。']], note: '具体菜单取决于安装版本；应用系统设置可能要求管理员权限。', source: kaliTool('kali-tweaks'), risk: 'write' },
    { command: 'apt search kali-tools', summary: '按 Kali 工具分类查找元包，避免盲目安装全部工具。', syntax: 'apt search --names-only kali-tools', options: [['--names-only', '限定包名'], ['kali-tools', 'Kali 分类元包名称前缀']], examples: [['apt search --names-only kali-tools', '找到取证、Web、无线等工具类别。']], note: '元包安装的是依赖集合，不是单条命令；先阅读 apt show 和磁盘需求。', source: { title: 'Kali 元包说明', url: 'https://www.kali.org/docs/general-use/metapackages/' } },
    { command: 'apt show kali-linux-default', summary: '查看 Kali 默认工具集合的元包定义。', syntax: 'apt show kali-linux-default', options: [['show', '只读显示包说明'], ['-a', '显示索引中所有可用版本']], examples: [['apt show kali-linux-default', '检查默认工具集合的依赖与版本。']], note: '不同镜像已安装的集合不同；不要为了“完整”在空间不足时安装 everything。', source: { title: 'Kali 元包说明', url: 'https://www.kali.org/docs/general-use/metapackages/' } },
  ], { distros: ['kali'], scope: 'system', availability: '仅在 Kali 官方环境及其软件源中使用。' }),
  ...group('distro', [
    { command: 'parrot-upgrade', summary: '使用 Parrot 官方封装流程进行系统整体更新。', syntax: 'sudo parrot-upgrade', options: [['无附加参数', '使用官方默认升级流程']], examples: [['sudo parrot-upgrade', '先保存工作、建立快照，再按提示检查更新事务。']], note: '跨大版本升级还需阅读对应发行说明；不要混入 Kali 源或跳过签名检查。', permission: '需 sudo', risk: 'write', source: { title: 'Parrot 软件管理', url: 'https://parrotsec.org/docs/configuration/parrot-software-management/' } },
    { command: 'anonsurf', summary: 'Parrot 的隐私连接管理工具；本示例只检查状态。', syntax: 'anonsurf 子命令', options: [['status', '查看当前状态'], ['start / stop', '启停隐私连接，可能改变网络规则']], examples: [['sudo anonsurf status', '检查状态，不启动或修改连接。']], note: '它不能保证完全匿名；启停可能中断连接，不能用来绕过授权边界。不同版本以本机帮助为准。', permission: '管理操作需 sudo', source: { title: 'AnonSurf 官方说明', url: 'https://parrotsec.org/docs/tools/anonsurf/' } },
    { command: 'apt search parrot-tools', summary: '检索 Parrot 安全工具元包，了解 Home 与 Security 的工具差异。', syntax: 'apt search --names-only parrot-tools', options: [['--names-only', '仅搜索包名'], ['parrot-tools', '工具元包前缀']], examples: [['apt search --names-only parrot-tools', '查看当前源提供的安全工具组。']], note: '以 apt show 检查包说明；并非所有镜像都预装全部安全工具。', source: { title: 'Parrot 版本与工具集合', url: 'https://www.parrotsec.org/docs/introduction/download-parrot/' } },
  ], { distros: ['parrot'], scope: 'system', availability: 'Parrot 工具与官方软件源；其他系统不要直接照搬。' }),
  ...group('distro', [
    { command: 'BlackArch 工具组目录', summary: '从仓库数据库获取 BlackArch 的实际分类名单。', syntax: 'pacman -Sg | grep blackarch', options: [['-Sg', '列出仓库组'], ['grep blackarch', '只保留 BlackArch 组']], examples: [['pacman -Sg | grep blackarch', '用实际仓库目录选择学习方向。']], note: '未配置仓库时可能没有结果；不要下载未经校验的仓库引导脚本。' },
    { command: 'BlackArch 全部工具包', summary: '枚举属于 BlackArch 工具组的包并去重。', syntax: "pacman -Sgg | grep blackarch | cut -d' ' -f2 | sort -u", options: [['-Sgg', '显示组及成员'], ['sort -u', '去除跨组重复的软件包']], examples: [["pacman -Sgg | grep blackarch | cut -d' ' -f2 | sort -u", '按本机索引获取工具包名单；包可提供一个或多个命令。']], note: '工具包总数不等于可执行命令总数；用 pacman -Ql 查看每个包提供的文件。' },
    { command: 'BlackArch 分类安装', summary: '按已查询到的工具组安装，不必部署整个工具仓库。', syntax: 'sudo pacman -Syu blackarch-分类名', options: [['blackarch-forensic', '取证组示例'], ['-Syu', '结合完整升级执行安装']], examples: [['pacman -Sg blackarch-forensic', '先审查组成员，再决定是否实际安装该组。']], note: '实际分类安装可能占用大量空间；先检查包名单、依赖和事务提示。', risk: 'write', permission: '实际安装需 sudo' },
  ], { distros: ['blackarch'], scope: 'system', availability: '已配置官方 BlackArch 仓库的 Arch 系统。', source: { title: 'BlackArch 仓库与工具组说明', url: 'https://blackarch.org/downloads.html' } }),
]

const securityCommands = group('security', [
  { command: 'nmap', summary: '在授权目标上发现开放端口与服务，帮助盘点暴露面。', syntax: 'nmap [选项] 目标', options: [['-sV', '服务版本探测'], ['-p 端口列表', '限定端口'], ['-oN 文件', '保存普通文本结果']], examples: [['nmap -sV -p 22,80 127.0.0.1', '只探测本机两个端口，观察端口与服务字段。']], note: '版本识别不是漏洞证据。只对明确授权目标使用，不把目标替换为任意公网网段。', risk: 'network', source: { title: 'Nmap 官方参数说明', url: 'https://nmap.org/book/man-briefoptions.html' } },
  { command: 'tcpdump', summary: '读取抓包文件或捕获授权接口流量，用来分析网络故障。', syntax: 'tcpdump [选项] [过滤表达式]', options: [['-r 文件', '读取已有抓包'], ['-nn', '不解析主机和服务名'], ['-c 数量', '限制处理包数']], examples: [['tcpdump -nn -r lab.pcap -c 20', '离线读取实验抓包前 20 个包。']], note: '实时抓包可能需要额外权限并涉及他人通信内容；只读已获授权的数据。', source: { title: 'tcpdump 官方手册', url: 'https://www.tcpdump.org/manpages/tcpdump.1.html' } },
  { command: 'tshark', summary: '使用 Wireshark 的命令行解析器分析抓包文件。', syntax: 'tshark [选项]', options: [['-r 文件', '读取抓包'], ['-Y 过滤器', '应用显示过滤器'], ['-T fields', '按字段导出']], examples: [['tshark -r lab.pcap -Y "dns"', '只查看实验抓包中可解析的 DNS 数据。']], note: '-Y 显示过滤器与抓取时的 -f 过滤语法不同。', source: { title: 'TShark 官方手册', url: 'https://www.wireshark.org/docs/man-pages/tshark.html' } },
  { command: 'wireshark', summary: '图形化逐层查看网络数据包和协议字段。', syntax: 'wireshark [选项]', options: [['-r 文件', '启动后打开抓包'], ['-Y 过滤器', '预设显示过滤器']], examples: [['wireshark -r lab.pcap', '以普通用户打开自己的实验抓包。']], note: 'GUI 不应以 root 运行；实时抓包权限按发行版的 capture/dumpcap 机制配置。', source: { title: 'Wireshark 官方手册', url: 'https://www.wireshark.org/docs/man-pages/wireshark.html' } },
  { command: 'sha256sum', summary: '计算或核对文件摘要，确认下载或备份是否被改变。', syntax: 'sha256sum [选项] 文件', options: [['-c 清单', '核对校验清单'], ['--strict', '对清单格式错误返回失败']], examples: [['sha256sum lab.iso', '把摘要与可信来源发布的值逐字核对。']], note: '自己算出的哈希不能单独证明来源可信，必须对照可信校验值或签名。' },
  { command: 'gpg', summary: '验证发布者签名，或管理自己的加密签名密钥。', syntax: 'gpg [选项]', options: [['--verify 签名 文件', '验证分离签名'], ['--fingerprint', '显示公钥指纹']], examples: [['gpg --verify lab.iso.sig lab.iso', '用已核对指纹的发布者公钥验证实验镜像。']], note: '好签名不等于你信任该密钥；通过独立可信渠道核对指纹。', source: archManual('gpg') },
  { command: 'openssl', summary: '检查证书、密钥格式和加密数据；学习时优先进行只读分析。', syntax: 'openssl 子命令 [选项]', options: [['x509', '查看 X.509 证书'], ['-noout', '不输出完整编码'], ['-dates', '证书生效与到期时间']], examples: [['openssl x509 -in lab.pem -noout -subject -dates', '检查本地实验 PEM 证书的主题与有效期。']], note: '证书文件与私钥文件不同，不要输出或上传私钥；时间有效不等于整个信任链有效。', source: { title: 'OpenSSL 命令参考', url: 'https://docs.openssl.org/master/man1/openssl/' } },
  { command: 'nft', summary: '查看或配置 nftables 主机防火墙规则。', syntax: 'nft [选项] 命令', options: [['list ruleset', '查看完整规则集'], ['-a', '显示规则句柄']], examples: [['sudo nft list ruleset', '只读检查本机包过滤策略。']], note: '不要随意 flush ruleset；修改规则可能断开 SSH 或暴露服务。', permission: '需 sudo', source: archManual('nft', 8) },
  { command: 'ufw', summary: '通过较易读的界面管理主机防火墙。', syntax: 'ufw [命令]', options: [['status verbose', '显示状态与默认策略'], ['status numbered', '显示规则编号']], examples: [['sudo ufw status verbose', '只读审计当前防火墙。']], note: 'UFW 并非所有镜像默认安装；启用防火墙前确认远程管理端口允许规则。', permission: '需 sudo', source: archManual('ufw', 8) },
  { command: 'aa-status', summary: '检查 AppArmor 是否启用，以及哪些策略正在强制或观察模式。', syntax: 'aa-status [选项]', options: [['--enabled', '用退出状态检查启用情况'], ['--json', '输出结构化统计；需版本支持']], examples: [['sudo aa-status', '检查系统应用隔离策略的实际状态。']], note: '内核与发行版须启用 AppArmor；没有 profile 不代表所有应用都已被隔离。', permission: '通常需 sudo', source: archManual('aa-status', 8) },
  { command: 'lynis', summary: '审计本机系统配置并生成加固建议。', syntax: 'lynis 命令 [选项]', options: [['audit system', '执行本机审计'], ['show version', '查看版本'], ['--no-colors', '禁用彩色输出']], examples: [['sudo lynis audit system', '在自有实验虚拟机检查配置并阅读报告。']], note: '审计可能写日志并有一定负载；建议不是自动修复指令，应逐项评估。', permission: '完整审计通常需 sudo', source: kaliTool('lynis') },
  { command: 'fail2ban-client', summary: '检查 Fail2ban 的运行状态和防护规则集合。', syntax: 'fail2ban-client 命令 [名称]', options: [['status', '查看启用的 jail'], ['status 名称', '检查指定 jail 状态']], examples: [['sudo fail2ban-client status', '查看本机是否配置了登录防护。']], note: '需要已安装并启动服务；误配置可能封禁自己的远程地址。', permission: '通常需 sudo', source: archManual('fail2ban-client') },
  { command: 'exiftool', summary: '读取照片、文档等文件中的元数据。', syntax: 'exiftool [选项] 文件', options: [['-a', '包含重复标签'], ['-G1', '显示标签组'], ['-s', '显示简短标签名']], examples: [['exiftool -a -G1 -s sample.jpg', '离线查看自己样本的时间、设备与位置信息。']], note: '发布照片前检查位置数据；修改元数据必须在副本上进行。', source: { title: 'ExifTool 官方文档', url: 'https://exiftool.org/exiftool_pod.html' } },
  { command: 'strings', summary: '提取二进制中的可打印文本，进行静态初筛。', syntax: 'strings [选项] 文件', options: [['-n 数量', '最小字符串长度'], ['-t x', '显示十六进制偏移']], examples: [['strings -n 8 sample.bin', '在不执行样本的情况下查看较长文本。']], note: '可打印文本不一定真实反映行为；未知样本应放在隔离分析环境。' },
  { command: 'binwalk', summary: '扫描固件或二进制样本中的已知文件特征。', syntax: 'binwalk [选项] 文件', options: [['文件', '指定本地样本'], ['--help', '核对安装版本支持的扫描与提取选项']], examples: [['binwalk firmware.bin', '对自有固件副本做静态结构识别。']], note: '不同大版本参数有变化；默认先扫描，不自动提取或执行嵌入内容。', source: kaliTool('binwalk') },
  { command: 'yara', summary: '使用自己编写或审查过的规则匹配文件特征。', syntax: 'yara [选项] 规则文件 目标', options: [['-r', '递归扫描目录'], ['-s', '显示匹配字符串'], ['-w', '关闭警告；排查时不建议']], examples: [['yara lab.yar sample.bin', '将已有实验规则应用于样本副本。']], note: '匹配只是线索，误报和漏报都可能存在；不要运行来历不明的规则或样本。', source: { title: 'YARA 命令行说明', url: 'https://yara.readthedocs.io/en/stable/commandline.html' } },
  { command: 'mmls', summary: '解析磁盘镜像分区布局，为后续只读取证提供偏移信息。', syntax: 'mmls [选项] 镜像', options: [['-B', '显示分区大小字节信息'], ['-o 偏移', '卷系统起点，以扇区计']], examples: [['mmls disk.img', '读取自有磁盘镜像的分区表。']], note: '记录扇区大小和分区起始位置；不要把字节偏移与扇区偏移混淆。', source: { title: 'Sleuth Kit mmls', url: 'https://www.sleuthkit.org/sleuthkit/man/mmls.html' } },
  { command: 'fls', summary: '列出文件系统镜像内的文件名与元数据编号。', syntax: 'fls [选项] 镜像', options: [['-r', '递归列出'], ['-o 扇区', '指定文件系统起始偏移']], examples: [['fls filesystem.img', '读取从分区起点开始的文件系统镜像。']], note: '完整磁盘镜像应先用 mmls 查分区，再填写正确 -o；原始证据只读保留。', source: { title: 'Sleuth Kit fls', url: 'https://www.sleuthkit.org/sleuthkit/man/fls.html' } },
  { command: 'vol', summary: '使用 Volatility 3 插件离线分析获授权的内存镜像。', syntax: 'vol [选项] 插件', options: [['-f 文件', '输入内存镜像'], ['-h', '查看可用插件和参数']], examples: [['vol -f windows.raw windows.pslist', '列出已获取的 Windows 实验内存镜像中的进程。']], note: '命令入口可能是 vol 或 vol.py，插件也依赖镜像系统与符号表；不要套用 Volatility 2 参数。', source: { title: 'Volatility 3 官方内存镜像教程', url: 'https://volatility3.readthedocs.io/en/stable/getting-started-windows-tutorial.html' } },
  { command: 'whatweb', summary: '识别授权 Web 服务可能使用的技术和响应特征。', syntax: 'whatweb [选项] URL', options: [['-a 1', '低请求强度模式'], ['--log-json 文件', '保存结构化结果']], examples: [['whatweb -a 1 http://127.0.0.1:8080', '对已启动的本地实验网站做指纹观察。']], note: '结果可能是推测，不能据此确认漏洞；不要未经授权探测真实网站。', risk: 'network', source: kaliTool('whatweb') },
  { command: 'nikto', summary: '审查授权 Web 服务器的常见配置与已知问题。', syntax: 'nikto [选项]', options: [['-h 主机', '指定目标，不是帮助开关'], ['-p 端口', '指定服务端口'], ['-Help', '完整帮助']], examples: [['nikto -Help', '先学习检查项与选项，不发起扫描。']], note: '主动扫描可能产生大量请求，仅在隔离靶场按授权范围运行。', risk: 'network', source: kaliTool('nikto') },
  { command: 'gobuster', summary: '基于字典验证授权靶场的路径或其他资源。', syntax: 'gobuster 模式 [选项]', options: [['dir', '目录路径模式'], ['-u URL', '目标地址'], ['-w 文件', '使用本地实验字典']], examples: [['gobuster dir --help', '先阅读目录模式参数，确认版本与限速方法。']], note: '字典验证属于主动请求；不能对未经授权的站点运行。', risk: 'network', source: kaliTool('gobuster') },
  { command: 'ffuf', summary: '在自有实验服务中把 FUZZ 位置替换为字典项并观察响应。', syntax: 'ffuf -w 字典 -u URL [选项]', options: [['-w 文件', '输入字典'], ['-rate 数量', '每秒请求上限'], ['-t 数量', '并发线程数']], examples: [['ffuf -w lab-paths.txt -u http://127.0.0.1:8080/FUZZ -rate 2 -t 1', '对已启动的本地靶场使用小型实验字典和低速请求。']], note: '先准备 lab-paths.txt，确认目标由自己控制；不能把示例地址直接换成任意网站。', risk: 'network', source: kaliTool('ffuf') },
  { command: 'sqlmap', summary: 'SQL 注入评估工具；入门先学习参数与授权边界。', syntax: 'sqlmap [选项]', options: [['-h', '基础帮助'], ['-hh', '高级帮助'], ['--version', '查看版本']], examples: [['sqlmap -h', '仅查看帮助，不访问目标或读取数据库。']], note: '实际评估只允许自有隔离靶场或明确授权系统，自动测试可能改变应用行为。', risk: 'network', source: kaliTool('sqlmap') },
  { command: 'msfconsole', summary: 'Metasploit 模块控制台，供授权安全验证与实验学习。', syntax: 'msfconsole [选项]', options: [['-h', '命令行帮助'], ['-q', '安静启动控制台']], examples: [['msfconsole -h', '查看启动方式；不加载攻击模块或连接目标。']], note: '使用前了解模块影响；本手册不自动运行模块或载荷。', risk: 'network', source: kaliTool('metasploit-framework') },
  { command: 'searchsploit', summary: '离线查询 Exploit-DB 记录，用来理解漏洞公告与影响版本。', syntax: 'searchsploit [选项] 关键词', options: [['-t', '仅匹配标题'], ['-w', '显示在线记录链接']], examples: [['searchsploit -t nginx', '只查询本机索引中的标题，不执行任何示例代码。']], note: '命中结果不代表自己的服务可被利用；先核对版本、配置与补丁。', source: kaliTool('exploitdb') },
  { command: 'hashcat', summary: '审计获授权的离线密码哈希，先辨认格式和计算资源。', syntax: 'hashcat [选项]', options: [['--example-hashes', '查看受支持格式样例'], ['-I', '查看计算设备信息'], ['--help', '完整参数']], examples: [['hashcat --example-hashes', '学习哈希格式，不运行密码恢复任务。']], note: '只处理自己或获授权的数据；禁止将他人凭据导入练习，计算任务可能占满硬件。', source: kaliTool('hashcat') },
  { command: 'john', summary: 'John the Ripper 的离线密码审计工具，功能取决于构建版本。', syntax: 'john [选项]', options: [['--list=formats', 'Jumbo 版本列出格式'], ['--test', '本地性能自测，不使用真实哈希']], examples: [['john --list=formats', '了解 Jumbo 构建支持的格式。']], note: '基础版本可能没有 --list；先看本机帮助，只对授权样本进行审计。', source: kaliTool('john') },
  { command: 'aircrack-ng', summary: '无线安全审计套件中的离线分析工具。', syntax: 'aircrack-ng [选项] 抓包', options: [['--help', '查看参数与支持格式'], ['抓包文件', '必须来自自己的授权实验网络']], examples: [['aircrack-ng --help', '学习能力范围，不发射无线帧或恢复口令。']], note: '只有自己的实验数据可用于练习；不能干扰周围无线网络。', source: kaliTool('aircrack-ng') },
], { availability: '各系统均可作为工具学习环境，但是否已安装、包名和版本以各自官方仓库为准；可用 command -v 先检查。' })

export const commandCatalog = [
  ...helpCommands, ...fileCommands, ...textCommands, ...userCommands,
  ...processCommands, ...serviceCommands.map(entry => /^(systemctl|journalctl|hostnamectl|timedatectl)/.test(entry.command) ? { ...entry, distros: entry.distros.filter(id => id !== 'pentoo') } : entry), ...networkCommands, ...storageCommands,
  ...archiveCommands, ...shellCommands, ...developmentCommands,
  ...aptCommands, ...pacmanCommands, ...distroCommands, ...securityCommands,
  ...group('packages', pentooPackageEntries, { distros: ['pentoo'], scope: 'system', availability: 'Pentoo / Gentoo：Portage 与 gentoolkit；是否安装以本机状态为准。' }),
  ...group('distro', pentooDistroEntries, { distros: ['pentoo'], scope: 'system', availability: 'Pentoo / Gentoo 专属查询；附加 eselect 模块需要单独安装。' }),
  ...group('services', pentooServiceEntries, { distros: ['pentoo'], scope: 'system', availability: '本 Pentoo 教学环境选用 OpenRC；真实系统先核对 init 与服务名称。' }),
]

export function getDistroCommands(distro) {
  const id = typeof distro === 'string' ? distro : distro.id
  return commandCatalog.filter((entry) => entry.distros.includes(id))
}

export function filterCommands(entries, { query = '', category = 'all', scope = 'all' } = {}) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const matches = entries.filter((entry) => {
    if (category !== 'all' && entry.category !== category) return false
    if (scope !== 'all' && entry.scope !== scope) return false
    const text = [entry.command, entry.summary, entry.tag, entry.syntax, entry.note,
      ...entry.options.flatMap((option) => [option.flag, option.description]),
      ...entry.examples.flatMap((example) => [example.code, example.explanation]),
    ].join(' ').toLowerCase()
    return terms.every((term) => text.includes(term))
  })
  if (!terms.length) return matches
  const phrase = terms.join(' ')
  function relevance(entry) {
    const name = entry.command.toLowerCase()
    if (name === phrase) return 0
    if (name.startsWith(phrase)) return 1
    if (terms.every((term) => name.includes(term))) return 2
    return 3
  }
  return matches.sort((left, right) => relevance(left) - relevance(right))
}
