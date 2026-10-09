# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-10-09T00:27:48.099Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 6.91% | 4004.26 | 2.6 a | 2.432 | -2.39% | 2.47% | 07/10/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 6.97% | 4656.56 | 3.465 a | 3.239 | -3.17% | 3.31% | 07/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 6.94% | 4599.33 | 4.968 a | 4.646 | -4.5% | 4.79% | 07/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 6.95% | 3216.5 | 5.855 a | 5.474 | -5.3% | 5.65% | 07/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 6.94% | 4602.87 | 6.638 a | 6.207 | -5.95% | 6.46% | 07/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 6.95% | 2678.84 | 8.603 a | 8.044 | -7.68% | 8.4% | 07/10/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 6.95% | 4556.56 | 7.725 a | 7.223 | -6.87% | 7.58% | 07/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 6.76% | 4498.31 | 9.399 a | 8.804 | -8.27% | 9.34% | 07/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 6.69% | 1948.79 | 13.86 a | 12.991 | -12.09% | 13.9% | 07/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 6.71% | 4539.42 | 10.957 a | 10.268 | -9.49% | 11.05% | 07/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 6.63% | 1451.47 | 18.611 a | 17.454 | -15.85% | 19.06% | 07/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 6.7% | 4432.86 | 12.498 a | 11.714 | -10.66% | 12.77% | 07/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 6.62% | 1040.62 | 23.866 a | 22.384 | -19.77% | 24.99% | 07/10/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 6.63% | 4516.59 | 13.22 a | 12.398 | -11.14% | 13.65% | 07/10/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 6.62% | 4431.75 | 14.142 a | 13.264 | -11.78% | 14.74% | 07/10/2026 |

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
- Duration e sensibilidade usam dias corridos/365. A convenção oficial da ANBIMA
  para NTN-B é dias úteis/252 — a diferença é desprezível para duration, mas existe.
- A sensibilidade é uma aproximação de segunda ordem (duration + convexidade), não
  uma reprecificação exata.
- Uso informativo. Não é recomendação de investimento.
