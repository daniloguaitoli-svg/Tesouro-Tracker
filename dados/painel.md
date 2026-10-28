# Painel — Tesouro Tracker

Retrato gerado automaticamente em 2026-10-28T21:44:27.093Z.

## Acompanhados de perto

| Vencimento | Título | Taxa | Significa | PU (R$) | Duration | +1 p.p. | Data |
| --- | --- | ---: | --- | ---: | ---: | ---: | --- |
| 01/01/2029 | Tesouro Prefixado 2029 | 14.88% | juros nominais ao ano (a inflação do período corre por conta do investidor) | 741.63 | 2.151 a | -1.85% | 27/10/2026 |
| 01/03/2031 | Tesouro Selic 2031 | 0.1% | ágio/deságio sobre a Selic (não é uma taxa cheia; pode ser negativo) | 20094.02 | — | — | 27/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 | 7.84% | juros reais ao ano ACIMA do IPCA | 3088.1 | 5.758 a | -5.17% | 27/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 | 7.9% | juros reais ao ano ACIMA do IPCA | 2502.69 | 8.484 a | -7.52% | 27/10/2026 |

## Moldura

| Indicador | Valor | 12 meses | 1 semana | Data |
| --- | ---: | ---: | ---: | --- |
| IPCA (acum. 12m) | 4.58% | — | — | 01/09/2026 |
| Ibovespa | 171006 pts | 15.99% | -17.19% | 28/10/2026 |
| EUR/BRL | 5.9515 | -4.93% | 5.5% | 28/10/2026 |
| USD/BRL | 5.342 | -0.5% | 6.25% | 28/10/2026 |
| CDI | 13.65% a.a. | — | — | 27/10/2026 |
| Selic (meta) | 13.75% a.a. | — | — | 28/10/2026 |

## Ressalvas

- São os vencimentos marcados como destaque no catálogo do repositório. A estrela do app é escolhida por aparelho (localStorage) e o servidor não a conhece — se a seleção do celular for outra, esta lista não a reflete.
- Taxas em % ao ano; veja `taxaSignifica` em cada título, porque o mesmo número quer dizer coisas diferentes por família. Prazo e duration em anos de dias úteis/252, a convenção oficial do Tesouro e da ANBIMA. variacaoPrecoMais1pp = variação % estimada do preço se a taxa subir 1 ponto percentual, já com convexidade. Variações de 12 meses e 1 semana comparam com o último pregão EM OU ANTES do alvo (mercado não abre em fim de semana); `desde` diz de que data a comparação parte. Campo ausente ou null = dado indisponível, nunca estimado.
- Fontes públicas, com defasagem de ao menos um dia útil. Uso informativo — não é recomendação de investimento.
