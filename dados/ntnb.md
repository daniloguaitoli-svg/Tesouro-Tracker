# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-10-14T20:45:51.208Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 6.66% | 4041.16 | 2.586 a | 2.425 | -2.38% | 2.47% | 13/10/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 6.67% | 4716.55 | 3.454 a | 3.238 | -3.17% | 3.31% | 13/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 6.67% | 4671.83 | 4.961 a | 4.651 | -4.51% | 4.79% | 13/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 6.68% | 3274.46 | 5.841 a | 5.475 | -5.3% | 5.65% | 13/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 6.68% | 4692.22 | 6.644 a | 6.228 | -5.97% | 6.49% | 13/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 6.69% | 2743.75 | 8.589 a | 8.05 | -7.69% | 8.41% | 13/10/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 6.69% | 4657.33 | 7.744 a | 7.258 | -6.9% | 7.61% | 13/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 6.59% | 4580.35 | 9.423 a | 8.841 | -8.3% | 9.38% | 13/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 6.56% | 1988.04 | 13.847 a | 12.994 | -12.09% | 13.9% | 13/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 6.59% | 4610.08 | 10.995 a | 10.315 | -9.53% | 11.1% | 13/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 6.56% | 1473.83 | 18.597 a | 17.452 | -15.85% | 19.06% | 13/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 6.59% | 4504.46 | 12.558 a | 11.782 | -10.72% | 12.85% | 13/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 6.57% | 1055.57 | 23.852 a | 22.382 | -19.77% | 24.99% | 13/10/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 6.55% | 4575.97 | 13.28 a | 12.464 | -11.2% | 13.73% | 13/10/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 6.54% | 4493.16 | 14.22 a | 13.347 | -11.85% | 14.84% | 13/10/2026 |

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
