# Painel — Tesouro Tracker

Retrato gerado automaticamente em 2026-09-12T14:13:44.319Z.

## Acompanhados de perto

| Vencimento | Título | Taxa | Significa | PU (R$) | Duration | +1 p.p. | Data |
| --- | --- | ---: | --- | ---: | ---: | ---: | --- |
| 01/01/2029 | Tesouro Prefixado 2029 | 13.93% | juros nominais ao ano (a inflação do período corre por conta do investidor) | 742.61 | 2.307 a | -2% | 10/09/2026 |
| 01/03/2031 | Tesouro Selic 2031 | 0.07% | ágio/deságio sobre a Selic (não é uma taxa cheia; pode ser negativo) | 19790.6 | — | — | 10/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 | 7.79% | juros reais ao ano ACIMA do IPCA | 3041.71 | 5.929 a | -5.32% | 10/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 | 7.64% | juros reais ao ano ACIMA do IPCA | 2509.8 | 8.677 a | -7.7% | 10/09/2026 |

## Moldura

| Indicador | Valor | 12 meses | 1 semana | Data |
| --- | ---: | ---: | ---: | --- |
| IPCA (acum. 12m) | 4.22% | — | — | 01/08/2026 |
| Ibovespa | 187207 pts | 30.78% | 1.11% | 11/09/2026 |
| EUR/BRL | 5.9085 | -6.5% | -0.77% | 11/09/2026 |
| USD/BRL | 5.0918 | -5.46% | -0.65% | 11/09/2026 |
| CDI | 13.9% a.a. | — | — | 10/09/2026 |
| Selic (meta) | 14% a.a. | — | — | 12/09/2026 |

## Ressalvas

- São os vencimentos marcados como destaque no catálogo do repositório. A estrela do app é escolhida por aparelho (localStorage) e o servidor não a conhece — se a seleção do celular for outra, esta lista não a reflete.
- Taxas em % ao ano; veja `taxaSignifica` em cada título, porque o mesmo número quer dizer coisas diferentes por família. Duration em anos (dias corridos/365, aproximação da convenção oficial de dias úteis/252). variacaoPrecoMais1pp = variação % estimada do preço se a taxa subir 1 ponto percentual, já com convexidade. Variações de 12 meses e 1 semana comparam com o último pregão EM OU ANTES do alvo (mercado não abre em fim de semana); `desde` diz de que data a comparação parte. Campo ausente ou null = dado indisponível, nunca estimado.
- Fontes públicas, com defasagem de ao menos um dia útil. Uso informativo — não é recomendação de investimento.
