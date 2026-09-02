# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-09-02T22:42:15.653Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.98% | 3858.39 | 2.701 a | 2.502 | -2.46% | 2.54% | 01/09/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 8.11% | 4438.41 | 3.557 a | 3.291 | -3.22% | 3.36% | 01/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 8.09% | 4313.15 | 5.04 a | 4.663 | -4.52% | 4.81% | 01/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 8.11% | 2985.95 | 5.956 a | 5.509 | -5.33% | 5.69% | 01/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.94% | 4281.05 | 6.662 a | 6.172 | -5.92% | 6.43% | 01/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.92% | 2451.82 | 8.704 a | 8.065 | -7.7% | 8.43% | 01/09/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.77% | 4250.44 | 7.722 a | 7.165 | -6.82% | 7.51% | 01/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.65% | 4119.43 | 9.3 a | 8.639 | -8.12% | 9.16% | 01/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.54% | 1727.73 | 13.962 a | 12.983 | -12.08% | 13.89% | 01/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.56% | 4123.15 | 10.692 a | 9.941 | -9.2% | 10.68% | 01/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.42% | 1252.5 | 18.712 a | 17.42 | -15.82% | 19.02% | 01/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.54% | 3984.93 | 12.043 a | 11.199 | -10.21% | 12.18% | 01/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.4% | 865.95 | 23.967 a | 22.316 | -19.72% | 24.91% | 01/09/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.43% | 4059.14 | 12.604 a | 11.732 | -10.58% | 12.88% | 01/09/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.42% | 3958.01 | 13.352 a | 12.429 | -11.1% | 13.76% | 01/09/2026 |

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
