# Painel — Tesouro Tracker

Retrato gerado automaticamente em 2026-11-10T04:40:46.853Z.

## Acompanhados de perto

| Vencimento | Título | Taxa | Significa | PU (R$) | Duration | +1 p.p. | Data |
| --- | --- | ---: | --- | ---: | ---: | ---: | --- |
| 01/01/2029 | Tesouro Prefixado 2029 | 14.78% | juros nominais ao ano (a inflação do período corre por conta do investidor) | 745.87 | 2.119 a | -1.82% | 06/11/2026 |
| 01/03/2031 | Tesouro Selic 2031 | 0.11% | ágio/deságio sobre a Selic (não é uma taxa cheia; pode ser negativo) | 20160.62 | — | — | 06/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 | 7.86% | juros reais ao ano ACIMA do IPCA | 3093.8 | 5.726 a | -5.14% | 06/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 | 7.87% | juros reais ao ano ACIMA do IPCA | 2515.93 | 8.452 a | -7.49% | 06/11/2026 |

## Moldura

| Indicador | Valor | 12 meses | 1 semana | Data |
| --- | ---: | ---: | ---: | --- |
| IPCA (acum. 12m) | 4.58% | — | — | 01/09/2026 |
| Ibovespa | 172236 pts | 11.8% | 2.57% | 09/11/2026 |
| EUR/BRL | 6.1741 | -0.41% | 2.01% | 09/11/2026 |
| USD/BRL | 5.5146 | 2.95% | 1.72% | 09/11/2026 |
| CDI | 13.65% a.a. | — | — | 06/11/2026 |
| Selic (meta) | 13.75% a.a. | — | — | 10/11/2026 |

## Ressalvas

- São os vencimentos marcados como destaque no catálogo do repositório. A estrela do app é escolhida por aparelho (localStorage) e o servidor não a conhece — se a seleção do celular for outra, esta lista não a reflete.
- Taxas em % ao ano; veja `taxaSignifica` em cada título, porque o mesmo número quer dizer coisas diferentes por família. Prazo e duration em anos de dias úteis/252, a convenção oficial do Tesouro e da ANBIMA. variacaoPrecoMais1pp = variação % estimada do preço se a taxa subir 1 ponto percentual, já com convexidade. Variações de 12 meses e 1 semana comparam com o último pregão EM OU ANTES do alvo (mercado não abre em fim de semana); `desde` diz de que data a comparação parte. Campo ausente ou null = dado indisponível, nunca estimado.
- Fontes públicas, com defasagem de ao menos um dia útil. Uso informativo — não é recomendação de investimento.
