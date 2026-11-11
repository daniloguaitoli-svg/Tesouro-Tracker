# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-11-11T18:44:56.097Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.51% | 3990.06 | 2.48 a | 2.307 | -2.27% | 2.34% | 10/11/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.6% | 4613.72 | 3.338 a | 3.102 | -3.04% | 3.17% | 10/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.67% | 4496.79 | 4.823 a | 4.48 | -4.35% | 4.61% | 10/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.71% | 3120.85 | 5.722 a | 5.313 | -5.15% | 5.48% | 10/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.68% | 4447.7 | 6.444 a | 5.985 | -5.74% | 6.23% | 10/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.71% | 2549.56 | 8.448 a | 7.844 | -7.5% | 8.19% | 10/11/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.61% | 4395.25 | 7.499 a | 6.969 | -6.64% | 7.3% | 10/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.48% | 4272.62 | 9.095 a | 8.462 | -7.96% | 8.96% | 10/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.43% | 1791.02 | 13.683 a | 12.736 | -11.87% | 13.61% | 10/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.45% | 4260.31 | 10.493 a | 9.766 | -9.05% | 10.49% | 10/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.39% | 1286.66 | 18.393 a | 17.127 | -15.58% | 18.67% | 10/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.45% | 4114.02 | 11.86 a | 11.038 | -10.08% | 12% | 10/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.4% | 884.97 | 23.611 a | 21.984 | -19.47% | 24.5% | 10/11/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.44% | 4143.76 | 12.359 a | 11.503 | -10.38% | 12.62% | 10/11/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.46% | 4025.42 | 13.081 a | 12.173 | -10.88% | 13.47% | 10/11/2026 |

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
