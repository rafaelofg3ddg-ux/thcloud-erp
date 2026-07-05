type DeviceMockupProps = {
  accent: string;
  accentSoft: string;
  variant: "cloud" | "clinica";
};

export default function DeviceMockup({ accent, accentSoft, variant }: DeviceMockupProps) {
  const linhas = variant === "cloud"
    ? ["Venda #4821", "Venda #4820", "Venda #4819"]
    : ["Consulta 09:00", "Consulta 10:30", "Retorno 14:00"];

  return (
    <svg viewBox="0 0 560 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      {/* sombra suave */}
      <ellipse cx="280" cy="392" rx="220" ry="16" fill="black" opacity="0.25" />

      {/* NOTEBOOK */}
      <g>
        <rect x="70" y="40" width="360" height="230" rx="14" fill="#0f172a" stroke="rgba(255,255,255,0.08)" />
        <rect x="84" y="54" width="332" height="184" rx="6" fill="#111c2e" />

        {/* barra superior da tela */}
        <rect x="84" y="54" width="332" height="24" rx="6" fill="#182338" />
        <circle cx="98" cy="66" r="3.5" fill="#f87171" />
        <circle cx="110" cy="66" r="3.5" fill="#fbbf24" />
        <circle cx="122" cy="66" r="3.5" fill="#4ade80" />

        {/* sidebar */}
        <rect x="84" y="78" width="70" height="160" fill="#0d1626" />
        <rect x="94" y="92" width="50" height="8" rx="3" fill={accent} opacity="0.9" />
        <rect x="94" y="112" width="50" height="6" rx="3" fill="#3a4a63" />
        <rect x="94" y="128" width="50" height="6" rx="3" fill="#3a4a63" />
        <rect x="94" y="144" width="50" height="6" rx="3" fill="#3a4a63" />
        <rect x="94" y="160" width="50" height="6" rx="3" fill="#3a4a63" />

        {/* cartoes de conteudo */}
        <rect x="164" y="90" width="70" height="46" rx="8" fill="#182338" />
        <rect x="174" y="100" width="30" height="6" rx="3" fill={accentSoft} />
        <rect x="174" y="112" width="42" height="10" rx="3" fill="white" opacity="0.85" />

        <rect x="242" y="90" width="70" height="46" rx="8" fill="#182338" />
        <rect x="252" y="100" width="30" height="6" rx="3" fill={accentSoft} />
        <rect x="252" y="112" width="42" height="10" rx="3" fill="white" opacity="0.85" />

        <rect x="320" y="90" width="76" height="46" rx="8" fill="#182338" />
        <rect x="330" y="100" width="30" height="6" rx="3" fill={accentSoft} />
        <rect x="330" y="112" width="42" height="10" rx="3" fill="white" opacity="0.85" />

        {/* lista */}
        <rect x="164" y="146" width="232" height="80" rx="8" fill="#182338" />
        {linhas.map((linha, i) => (
          <g key={linha}>
            <circle cx="178" cy={166 + i * 20} r="3" fill={accent} />
            <rect x="188" y={163 + i * 20} width={120 - i * 12} height="6" rx="3" fill="white" opacity="0.7" />
            <rect x="352" y={163 + i * 20} width="34" height="6" rx="3" fill={accentSoft} />
          </g>
        ))}

        {/* base do notebook */}
        <path d="M50 270 L450 270 L430 286 L70 286 Z" fill="#1c2739" />
      </g>

      {/* TABLET sobreposto */}
      <g transform="translate(330,150)">
        <rect x="0" y="0" width="150" height="200" rx="16" fill="#0f172a" stroke="rgba(255,255,255,0.1)" />
        <rect x="10" y="14" width="130" height="172" rx="6" fill="#111c2e" />
        <rect x="10" y="14" width="130" height="20" rx="6" fill="#182338" />
        <rect x="20" y="46" width="110" height="34" rx="8" fill={accent} opacity="0.9" />
        <rect x="30" y="56" width="60" height="6" rx="3" fill="white" opacity="0.85" />
        <rect x="30" y="66" width="40" height="6" rx="3" fill="white" opacity="0.6" />
        <rect x="20" y="90" width="110" height="26" rx="6" fill="#182338" />
        <rect x="20" y="122" width="110" height="26" rx="6" fill="#182338" />
        <rect x="20" y="154" width="110" height="26" rx="6" fill="#182338" />
      </g>

      {/* selo "ao vivo" flutuante */}
      <g transform="translate(66,300)">
        <rect x="0" y="0" width="150" height="42" rx="21" fill="#0f172a" stroke="rgba(255,255,255,0.12)" />
        <circle cx="21" cy="21" r="8" fill={accent} />
        <path d="M17 21l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <rect x="38" y="14" width="96" height="6" rx="3" fill="white" opacity="0.85" />
        <rect x="38" y="24" width="60" height="5" rx="2.5" fill="white" opacity="0.5" />
      </g>
    </svg>
  );
}
