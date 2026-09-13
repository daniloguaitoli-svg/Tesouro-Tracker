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
// O ponto cheio precisa ser visivelmente MAIOR que a linha em que se apoia: a
// linha de hoje tem 2px, então um raio de 2 dava um disco de 4px que sumia
// dentro dela — na legenda e no gráfico. 2.6 destaca sem sujar o desenho.
const R_PONTO = 2.6;
const R_DESTAQUE = 4.2;
const R_ANEL = 2.9;
const R_ANEL_DESTAQUE = 4.4;

const desenhaveis = (series, campoX) =>
  (series || [])
    .map((s) => ({
      ...s,
      pontos: (s.pontos || [])
        .filter((p) => p[campoX] != null && Number.isFinite(p[campoX]))
        .sort((a, b) => a[campoX] - b[campoX]),
    }))
    .filter((s) => s.pontos.length >= 2);

// Zero-cupom e com cupom NÃO caem sobre a mesma curva. Cinco vencimentos da
// NTN-B (2032, 2035, 2040, 2045 e 2050) existem nas DUAS formas, com a mesma
// data e taxas diferentes — a polilinha única pulava na vertical no mesmo x,
// ida e volta, e aquele serrilhado não era o formato da curva, era o desenho
// costurando duas curvas diferentes. Separadas, cada uma fica lisa e a
// distância entre elas passa a ser legível: é o que o mercado cobra a mais (ou
// a menos) por receber cupom.
//
// A inflação implícita é derivada dos dois lados e não tem família: seus pontos
// não trazem `comCupom`, e aí não há nada a separar.
export function separarFamilias(pontos) {
  const com = pontos.filter((p) => p.comCupom === true);
  const sem = pontos.filter((p) => p.comCupom === false);
  return com.length && sem.length ? [sem, com] : [pontos];
}

// Ponto cheio = sem cupom, anel = com cupom. O anel é preenchido com a cor do
// cartão de propósito: sem isso a linha atravessa o miolo e ele vira bolinha.
function Marca({ x, y, comCupom, destaque, cor }) {
  const c = destaque ? "var(--accent)" : cor;
  return comCupom ? (
    <circle cx={x} cy={y} r={destaque ? R_ANEL_DESTAQUE : R_ANEL} fill="var(--surface)" stroke={c} strokeWidth="1.5" />
  ) : (
    <circle cx={x} cy={y} r={destaque ? R_DESTAQUE : R_PONTO} fill={c} />
  );
}

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
      {comDados.map((s) => (
        <g key={s.id}>
          {/* Uma polilinha por família. Uma família com um ponto só não vira
              linha — mas o marcador dela continua na tela, senão o título
              simplesmente sumiria do gráfico. */}
          {separarFamilias(s.pontos).map((grupo, gi) =>
            grupo.length < 2 ? null : (
              <path
                key={gi}
                d={grupo.map((p, i) => `${i ? "L" : "M"}${px(p[campoX]).toFixed(1)} ${py(p.taxa).toFixed(1)}`).join(" ")}
                fill="none"
                stroke={s.cor}
                strokeWidth={s.forte ? 2 : 1.4}
                strokeDasharray={s.tracejado ? TRACEJADO : undefined}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={s.forte ? 1 : 0.75}
              />
            )
          )}
          {s.forte &&
            s.pontos.map((p, i) => (
              <Marca key={i} x={px(p[campoX])} y={py(p.taxa)} comCupom={p.comCupom === true} destaque={p.destaque} cor={s.cor} />
            ))}
        </g>
      ))}
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
  // A forma do ponto só precisa de explicação quando as duas famílias estão na
  // tela — na inflação implícita não há família nenhuma.
  const temFamilias = itens.some(
    (s) => s.forte && s.pontos.some((p) => p.comCupom === true) && s.pontos.some((p) => p.comCupom === false)
  );

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
      {/* As entradas de PONTO vêm todas sobre um pedaço da linha de hoje, que é
          o único lugar onde há marcador — as três ficam alinhadas entre si e
          com as entradas de linha acima. */}
      {temFamilias && (
        <>
          <span className="legenda-item">
            <svg className="legenda-traco" viewBox="0 0 30 12" aria-hidden="true">
              <line x1="1" y1="6" x2="29" y2="6" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
              <Marca x={15} y={6} comCupom={false} cor="var(--accent)" />
            </svg>
            sem cupom
          </span>
          <span className="legenda-item">
            <svg className="legenda-traco" viewBox="0 0 30 12" aria-hidden="true">
              <line x1="1" y1="6" x2="29" y2="6" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
              <Marca x={15} y={6} comCupom cor="var(--accent)" />
            </svg>
            com cupom
          </span>
        </>
      )}
      {temDestaque && (
        <span className="legenda-item">
          {/* Aqui a amostra mostra a REGRA (pequeno → grande) e não um caso: o
              título acompanhado pode ser de qualquer das duas famílias, então
              desenhar só o ponto cheio maior estaria errado para metade deles. */}
          <svg className="legenda-traco" viewBox="0 0 30 12" aria-hidden="true">
            <line x1="1" y1="6" x2="29" y2="6" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="9" cy="6" r={R_PONTO} fill="var(--accent)" />
            <circle cx="21" cy="6" r={R_DESTAQUE} fill="var(--accent)" />
          </svg>
          maior = acompanhado
        </span>
      )}
    </div>
  );
}
