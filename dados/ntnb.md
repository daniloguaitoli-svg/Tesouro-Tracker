# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-11-22T00:26:35.032Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.46% | 4004.99 | 2.456 a | 2.286 | -2.25% | 2.32% | 19/11/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.65% | 4618.7 | 3.314 a | 3.079 | -3.01% | 3.14% | 19/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.77% | 4488.63 | 4.797 a | 4.451 | -4.32% | 4.58% | 19/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.82% | 3110.97 | 5.698 a | 5.285 | -5.12% | 5.45% | 19/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.81% | 4283.66 | 6.623 a | 6.143 | -5.9% | 6.39% | 19/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.86% | 2526.53 | 8.425 a | 7.811 | -7.47% | 8.15% | 19/11/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.72% | 4231.88 | 7.711 a | 7.159 | -6.82% | 7.5% | 19/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.59% | 4244.18 | 9.047 a | 8.409 | -7.91% | 8.91% | 19/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.54% | 1770.71 | 13.659 a | 12.701 | -11.84% | 13.57% | 19/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.59% | 4072.24 | 10.772 a | 10.012 | -9.28% | 10.75% | 19/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.55% | 1255.17 | 18.369 a | 17.08 | -15.54% | 18.62% | 19/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.59% | 4061.81 | 11.746 a | 10.917 | -9.97% | 11.86% | 19/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.56% | 856.64 | 23.587 a | 21.929 | -19.42% | 24.44% | 19/11/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.58% | 3947.17 | 12.652 a | 11.761 | -10.62% | 12.9% | 19/11/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.58% | 3977.74 | 12.93 a | 12.019 | -10.75% | 13.29% | 19/11/2026 |

## Como ler

- **Taxa real** — juros ao ano *acima* do IPCA. É a taxa de compra (recompra do
  Tesouro); títulos fora de oferta deixam de publicar a taxa de venda, mas seguem
  publicando esta.
- **PU** — preço unitário em reais, do mesmo lado da taxa.
- **Duration** — prazo médio ponderado dos fluxos, em anos (Macaulay). Para o
  Tesouro IPCA+ sem cupom, é igual ao prazo; com juros semestrais é bem menor,
  porque parte do dinheiro volta antes.
- **Dur. mod.** — duration modificada: a variação percentual aproximada do preço
  para cada 1 ponto percentual de variação da taxa.
- **+1 p.p. / −1 p.p.** — quanto o preço se move hoje se a taxa real subir ou cair
  1 ponto percentual, já com o termo de convexidade (por isso não são simétricos).
- ⭐ marca os vencimentos acompanhados de perto.
- Os números usam **ponto decimal** e as datas dos arquivos .json usam **ISO
  (aaaa-mm-dd)**. É um arquivo de intercâmbio: o ponto decimal evita a ambiguidade
  do formato brasileiro para quem lê por máquina. Na tabela acima as datas
  aparecem em dd/mm/aaaa por legibilidade.

## Ressalvas

- Os dados têm defasagem de pelo menos um dia útil: o arquivo do Tesouro é de
  fechamento e este retrato é gerado uma vez por dia.
- Prazo, duration e sensibilidade usam dias úteis/252, a convenção oficial do
  Tesouro e da ANBIMA. O calendário são os feriados nacionais.
- A sensibilidade é uma aproximação de segunda ordem (duration + convexidade), não
  uma reprecificação exata.
- Uso informativo. Não é recomendação de investimento.
