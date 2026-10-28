# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-10-28T02:23:05.562Z.
Fonte: Tesouro Nacional (Tesouro Transparente) + ANBIMA (mercado secundário).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 8.16% | 3914.66 | 2.516 a | 2.326 | -2.29% | 2.36% | 26/10/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 8.19% | 4511.6 | 3.369 a | 3.114 | -3.05% | 3.18% | 26/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 8.09% | 4395.12 | 4.848 a | 4.486 | -4.35% | 4.62% | 26/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 8.1% | 3044.4 | 5.758 a | 5.326 | -5.16% | 5.49% | 26/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 8.03% | 4338.08 | 6.453 a | 5.974 | -5.73% | 6.22% | 26/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 8.02% | 2478.28 | 8.484 a | 7.854 | -7.51% | 8.2% | 26/10/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.94% | 4278.38 | 7.493 a | 6.942 | -6.61% | 7.27% | 26/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.8% | 4142.49 | 9.06 a | 8.404 | -7.91% | 8.9% | 26/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.71% | 1721.52 | 13.718 a | 12.736 | -11.87% | 13.61% | 26/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.76% | 4117.78 | 10.397 a | 9.649 | -8.94% | 10.36% | 26/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.66% | 1223.74 | 18.429 a | 17.117 | -15.57% | 18.66% | 26/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.74% | 3969.78 | 11.709 a | 10.867 | -9.93% | 11.81% | 26/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.64% | 836.24 | 23.647 a | 21.968 | -19.45% | 24.48% | 26/10/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.72% | 3997.94 | 12.153 a | 11.282 | -10.2% | 12.37% | 26/10/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.66% | 3914 | 12.905 a | 11.987 | -10.73% | 13.25% | 26/10/2026 |

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
