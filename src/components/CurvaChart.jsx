// components/CurvaChart.jsx — a curva de juros reais, sem dependências.
//
// Diferente do AreaChart: aqui o eixo X é o PRAZO em anos, que não é
// igualmente espaçado (há vencimentos em 3, 9 e 34 anos). Então o X é escalado
// de verdade, não por índice — senão a curva mentiria sobre a forma dela, que é
// justamente o que se quer ler.

const L = 34; // espaço à esquerda para os rótulos do eixo Y
const B = 18; // espaço abaixo para os rótulos do eixo X

// O traço da linha histórica e o raio dos pontos moram aqui porque a LEGENDA
// desenha com os mesmos valores. Enquanto ela era um retângulo sólido pintado à
// mão no Curva.jsx, o tracejado simplesmente não aparecia nela: as três séries
// saíam idênticas menos pela cor, e num celular distinguir #8f9bb8 de #3d5a8f
// numa barrinha de 14×3px não acontece. Constante compartilhada = a legenda não
// pode divergir do gráfico.
export const TRACEJADO = "4 3";
// A legenda desenha o traço MAIS GROSSO (para se ler num celular) e por isso
// não pode reusar o par acima: a ponta redonda estica cada traço em
// strokeWidth/2 de cada lado, ou seja come strokeWidth INTEIRO do vão. A 1.4px
// no gráfico sobra 1,6px de vão e se vê; a 2.4px na legenda sobrava 0,6px — que
// numa tela de celular é uma barra sólida, exatamente o defeito que a legenda
// nova existia para corrigir. Então a legenda usa ponta reta (butt), onde o vão
// declarado é o vão que aparece, e 6+5 fecha certinho nos 28px da amostra:
// três traços cheios, sem sobra picada na ponta.
export const TRACEJADO_LEGENDA = "6 5";
const R_PONTO = 2;
const R_DESTAQUE = 3.4;

const desenhaveis = (series, campoX) =>
  (series || [])
    .map((s) => ({
      ...s,
      pontos: (s.pontos || [])
        .filter((p) => p[campoX] != null && Number.isFinite(p[campoX]))
        .sort((a, b) => a[campoX] - b[campoX]),
    }))
    .filter((s) => s.pontos.length >= 2);

export function CurvaChart({
  series,
  height = 220,
  width = 366,
  rotulo = "Curva de juros por prazo",
  campoX = "anos",
  sufixoX = "a",
}) {
  // Reordena pelo eixo escolhido. Trocar de prazo para duration REORDENA os
  // títulos — uma NTN-B 2060 com cupom tem duration menor que uma 2040
  // zero-cupom — e desenhar a polilinha na ordem antiga faria a linha voltar
  // sobre si mesma. Pontos sem o campo (duration null) saem em vez de virar
  // zero e ancorar a curva na origem.
  const comDados = desenhaveis(series, campoX);
  if (!comDados.length) return <svg className="curva" viewBox={`0 0 ${width} ${height}`} aria-hidden="true" />;

  const todos = comDados.flatMap((s) => s.pontos);
  const anosMin = Math.min(...todos.map((p) => p[campoX]));
  const anosMax = Math.max(...todos.map((p) => p[campoX]));
  const taxaMin = Math.min(...todos.map((p) => p.taxa));
  const taxaMax = Math.max(...todos.map((p) => p.taxa));
  const dx = anosMax - anosMin || 1;
  // Uma folga de 6% no eixo Y evita a linha encostar na borda do quadro.
  const folga = (taxaMax - taxaMin || 1) * 0.06;
  const yMin = taxaMin - folga;
  const yMax = taxaMax + folga;

  const px = (anos) => L + ((anos - anosMin) / dx) * (width - L - 6);
  const py = (taxa) => 6 + (1 - (taxa - yMin) / (yMax - yMin)) * (height - B - 12);

  const marcasY = [yMin + (yMax - yMin) * 0.15, (yMin + yMax) / 2, yMax - (yMax - yMin) * 0.15];
  const marcasX = [anosMin, (anosMin + anosMax) / 2, anosMax];

  return (
    <svg className="curva" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={rotulo}>
      {marcasY.map((t, i) => (
        <g key={i}>
          <line x1={L} y1={py(t)} x2={width - 6} y2={py(t)} stroke="var(--text)" strokeOpacity="0.06" />
          <text x={4} y={py(t) + 3} fontSize="9" fill="var(--muted)" fontFamily="var(--mono)">
            {t.toFixed(2)}%
          </text>
        </g>
      ))}
      {marcasX.map((a, i) => (
        <text key={i} x={px(a)} y={height - 4} fontSize="9" fill="var(--muted)" fontFamily="var(--mono)" textAnchor="middle">
          {a.toFixed(0)}{sufixoX}
        </text>
      ))}
      {comDados.map((s) => {
        const d = s.pontos.map((p, i) => `${i ? "L" : "M"}${px(p[campoX]).toFixed(1)} ${py(p.taxa).toFixed(1)}`).join(" ");
        return (
          <g key={s.id}>
            <path
              d={d}
              fill="none"
              stroke={s.cor}
              strokeWidth={s.forte ? 2 : 1.4}
              strokeDasharray={s.tracejado ? TRACEJADO : undefined}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={s.forte ? 1 : 0.75}
            />
            {s.forte &&
              s.pontos.map((p, i) => (
                <circle
                  key={i}
                  cx={px(p[campoX])}
                  cy={py(p.taxa)}
                  r={p.destaque ? R_DESTAQUE : R_PONTO}
                  fill={p.destaque ? "var(--accent)" : s.cor}
                />
              ))}
          </g>
        );
      })}
    </svg>
  );
}

// A legenda desenha a MESMA linha que o gráfico: mesma cor, mesmo tracejado,
// mesma opacidade — só mais grossa, que é convenção de legenda e não muda a
// identificação. Ela lê a lista `series`, então acrescentar ou repintar uma
// curva atualiza as duas coisas de uma vez; antes eram três <span> com a cor
// escrita à mão, que podiam passar a mentir sem ninguém notar.
//
// Ordem invertida de propósito: o gráfico desenha do mais antigo para o mais
// novo (para a curva de hoje ficar por cima), e a legenda lista do mais novo
// para o mais antigo, que é a ordem em que se lê.
export function CurvaLegenda({ series, campoX = "anos" }) {
  const itens = desenhaveis(series, campoX).reverse();
  if (!itens.length) return null;

  // O ponto maior só entra na legenda se houver algum na tela — explicar um
  // marcador que não aparece é ruído.
  const temDestaque = itens.some((s) => s.forte && s.pontos.some((p) => p.destaque));

  return (
    <div className="legenda">
      {itens.map((s) => (
        <span key={s.id} className="legenda-item">
          <svg className="legenda-traco" viewBox="0 0 30 12" aria-hidden="true">
            <line
              x1="1"
              y1="6"
              x2="29"
              y2="6"
              stroke={s.cor}
              strokeWidth={s.forte ? 3 : 2.4}
              strokeDasharray={s.tracejado ? TRACEJADO_LEGENDA : undefined}
              strokeLinecap={s.tracejado ? "butt" : "round"}
              opacity={s.forte ? 1 : 0.75}
            />
          </svg>
          {s.rotulo}
        </span>
      ))}
      {temDestaque && (
        <span className="legenda-item">
          {/* Ponto MAIOR SOBRE a linha de hoje, que é exatamente como aparece no
              gráfico — um ponto solto flutuando não é a mesma coisa e ainda
              desalinhava a amostra em relação às outras. */}
          <svg className="legenda-traco" viewBox="0 0 30 12" aria-hidden="true">
            <line x1="1" y1="6" x2="29" y2="6" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="15" cy="6" r={R_DESTAQUE + 1.4} fill="var(--accent)" />
          </svg>
          acompanhado de perto
        </span>
      )}
    </div>
  );
}
