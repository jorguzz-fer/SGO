# Template — Importação da Base de Funcionários

> A Raquel/Lidiane sobe **uma planilha** com a base e o SGO cria o cadastro único. Depois, toda
> guia já vem preenchida ao selecionar o funcionário (fim da redigitação). Colunas derivadas dos
> campos reais das guias + dados de gestão (eSocial/CNAE/grau de risco).

## Colunas da planilha de importação

| Coluna | Obrigatório | Exemplo | Uso no SGO |
|---|---|---|---|
| `cpf` | sim | 142.277.878-90 | **chave única** do funcionário |
| `nome` | sim | MARCIA DA SILVA RODRIGUES | identificação |
| `data_nascimento` | sim | 23/02/2004 | guia/ASO |
| `rg` | sim | 27.475.225-6 | guia |
| `pis` | não | | guia |
| `ctps` | não | | guia |
| `ctps_serie` | não | | guia |
| `matricula_esocial` | não | | guia presencial / integração |
| `data_admissao` | condicional | 04/05/2023 | base p/ periódico e admissional |
| `data_demissao` | não | | base p/ demissional |
| `funcao` | sim | AUXILIAR DE SERVIÇOS GERAIS | determina exames |
| `setor` | sim | FA ROSEIRA / PRYSMIAN | riscos (PGR) + roteamento |
| `cidade` | sim | Sorocaba | **roteamento p/ clínica** |
| `uf` | sim | SP | roteamento |
| `fone_celular` | sim | (11) 91648-3005 | telemedicina/notificação |
| `fone_residencial` | não | | contato |
| `email` | não | | notificação |
| `status` | não | ATIVO/AFASTADO/DEMITIDO | vidas ativas / faturamento |
| `ultimo_exame_tipo` | não | PERIODICO | semente do motor de regras |
| `ultimo_exame_data` | não | 10/05/2025 | calcula próximos vencimentos |

## Dados de empresa-cliente (cadastro, não na planilha de funcionários)
- Razão social, CNPJ, CNAE, **grau de risco** (DCAS = 3), logo (white label), endereço.
- Vínculo com o **PGR/PCMSO** vigente (define riscos por setor e periodicidades).

## Regras de importação
- `cpf` deduplicado: se já existe, **atualiza**; senão, cria.
- Datas aceitas em `dd/mm/aaaa`.
- Linhas sem `cpf`/`nome` → relatório de erro (não importa).
- `cidade`/`uf` ausentes → funcionário entra, mas roteamento presencial fica pendente de preenchimento.
