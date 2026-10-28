# Painel — Tesouro Tracker

Retrato gerado automaticamente em 2026-10-28T02:23:05.562Z.

## Acompanhados de perto

| Vencimento | Título | Taxa | Significa | PU (R$) | Duration | +1 p.p. | Data |
| --- | --- | ---: | --- | ---: | ---: | ---: | --- |
| 01/01/2029 | Tesouro Prefixado 2029 | 15.4% | juros nominais ao ano (a inflação do período corre por conta do investidor) | 734.03 | 2.151 a | -1.84% | 26/10/2026 |
| 01/03/2031 | Tesouro Selic 2031 | 0.1% | ágio/deságio sobre a Selic (não é uma taxa cheia; pode ser negativo) | 20084.44 | — | — | 26/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 | 8.1% | juros reais ao ano ACIMA do IPCA | 3044.4 | 5.758 a | -5.16% | 26/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 | 8.02% | juros reais ao ano ACIMA do IPCA | 2478.28 | 8.484 a | -7.51% | 26/10/2026 |

## Moldura

| Indicador | Valor | 12 meses | 1 semana | Data |
| --- | ---: | ---: | ---: | --- |
| IPCA (acum. 12m) | 4.58% | — | — | 01/09/2026 |
| Ibovespa | 175710 pts | 19.56% | -15.64% | 27/10/2026 |
| EUR/BRL | 5.9449 | -4.94% | 5.56% | 27/10/2026 |
| USD/BRL | 5.3346 | -0.74% | 6.39% | 27/10/2026 |
| CDI | 13.65% a.a. | — | — | 26/10/2026 |
| Selic (meta) | 13.75% a.a. | — | — | 28/10/2026 |

## Ressalvas

- São os vencimentos marcados como destaque no catálogo do repositório. A estrela do app é escolhida por aparelho (localStorage) e o servidor não a conhece — se a seleção do celular for outra, esta lista não a reflete.
- Taxas em % ao ano; veja `taxaSignifica` em cada título, porque o mesmo número quer dizer coisas diferentes por família. Prazo e duration em anos de dias úteis/252, a convenção oficial do Tesouro e da ANBIMA. variacaoPrecoMais1pp = variação % estimada do preço se a taxa subir 1 ponto percentual, já com convexidade. Variações de 12 meses e 1 semana comparam com o último pregão EM OU ANTES do alvo (mercado não abre em fim de semana); `desde` diz de que data a comparação parte. Campo ausente ou null = dado indisponível, nunca estimado.
- Fontes públicas, com defasagem de ao menos um dia útil. Uso informativo — não é recomendação de investimento.
