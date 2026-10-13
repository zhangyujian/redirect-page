const logoFiles = {
  kali: 'kali-dragon-user.png',
  parrot: 'parrot-logo.svg',
  blackarch: 'blackarch-logo.png',
  pentoo: 'pentoo-logo.webp',
}

export default function DistroLogo({ distro, className = '' }) {
  const theme = typeof distro === 'string' ? distro : distro?.theme || distro?.id
  const logoFile = logoFiles[theme] || logoFiles.kali

  return (
    <span className={`distro-mark ${theme} ${className}`.trim()} aria-hidden="true">
      <img src={`${import.meta.env.BASE_URL}assets/distro-logos/${logoFile}`} alt="" />
    </span>
  )
}
