# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-11-20T01:48:06.951Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.45% | 4002.74 | 2.456 a | 2.286 | -2.25% | 2.32% | 18/11/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.64% | 4616.44 | 3.314 a | 3.079 | -3.01% | 3.14% | 18/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.7% | 4499.04 | 4.799 a | 4.456 | -4.32% | 4.59% | 18/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.74% | 3121.65 | 5.698 a | 5.289 | -5.12% | 5.45% | 18/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.73% | 4301.32 | 6.628 a | 6.153 | -5.9% | 6.4% | 18/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.77% | 2542.31 | 8.425 a | 7.817 | -7.48% | 8.16% | 18/11/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.66% | 4246.71 | 7.718 a | 7.169 | -6.83% | 7.51% | 18/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.54% | 4258.69 | 9.058 a | 8.423 | -7.93% | 8.92% | 18/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.49% | 1780.58 | 13.659 a | 12.707 | -11.84% | 13.57% | 18/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.53% | 4093.56 | 10.796 a | 10.04 | -9.3% | 10.78% | 18/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.49% | 1267.09 | 18.369 a | 17.089 | -15.55% | 18.63% | 18/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.54% | 4080.83 | 11.778 a | 10.952 | -10% | 11.9% | 18/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.51% | 865.4 | 23.587 a | 21.94 | -19.43% | 24.45% | 18/11/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.53% | 3967.34 | 12.694 a | 11.805 | -10.66% | 12.95% | 18/11/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.53% | 3998.59 | 12.982 a | 12.073 | -10.8% | 13.35% | 18/11/2026 |

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
