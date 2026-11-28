# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-11-28T02:47:06.105Z.
Fonte: Tesouro Nacional (Tesouro Transparente) + ANBIMA (mercado secundário).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.31% | 4025.27 | 2.437 a | 2.271 | -2.23% | 2.31% | 26/11/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.51% | 4646.33 | 3.295 a | 3.065 | -3% | 3.13% | 26/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.67% | 4516.24 | 4.78 a | 4.439 | -4.31% | 4.57% | 26/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.72% | 3132.74 | 5.679 a | 5.272 | -5.11% | 5.44% | 26/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.69% | 4322.64 | 6.611 a | 6.139 | -5.89% | 6.39% | 26/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.73% | 2556.63 | 8.405 a | 7.802 | -7.46% | 8.14% | 26/11/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.6% | 4275.56 | 7.705 a | 7.161 | -6.82% | 7.5% | 26/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.46% | 4298 | 9.056 a | 8.428 | -7.93% | 8.93% | 26/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.41% | 1803.16 | 13.639 a | 12.698 | -11.83% | 13.56% | 26/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.44% | 4140.87 | 10.813 a | 10.064 | -9.32% | 10.8% | 26/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.39% | 1292.07 | 18.349 a | 17.087 | -15.55% | 18.63% | 26/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.44% | 4135.99 | 11.823 a | 11.004 | -10.05% | 11.96% | 26/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.39% | 890.65 | 23.567 a | 21.946 | -19.44% | 24.46% | 26/11/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.42% | 4029.21 | 12.767 a | 11.886 | -10.73% | 13.04% | 26/11/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.43% | 4057.24 | 13.069 a | 12.165 | -10.87% | 13.46% | 26/11/2026 |

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
