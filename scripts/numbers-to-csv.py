#!/usr/bin/env python3
"""Converte um export .numbers da base de funcionários (folha) para o CSV do
importador do SGO. Uso: pip install numbers-parser && python3 scripts/numbers-to-csv.py base.numbers saida.csv

Mapeamento (folha DCAS -> SGO):
  Nome->nome  CPF->cpf  Cód eSocial->matricula_esocial  Admissão->data_admissao
  Data Demissão->data_demissao  Data nascimento->data_nascimento  Sexo->sexo
  PIS->pis  CTPS->ctps  Serie CTPS->ctps_serie  Descrição cargo->funcao  CBO->cbo
  Descrição Serviço->tomador (cliente)  Descrição Dpto->setor  Cód Serviço->centro_custo
  Cidade->cidade  UF End->uf  Celular->fone_celular  Telefone->fone_residencial
  Email->email  Situação->status
RG não existe no export; Email costuma vir vazio.
"""
import csv, re, sys
from numbers_parser import Document

COLS = ["cpf","nome","data_nascimento","sexo","rg","pis","ctps","ctps_serie",
        "matricula_esocial","data_admissao","data_demissao","funcao","cbo","setor",
        "tomador","centro_custo","cidade","uf","fone_celular","fone_residencial","email","status"]

def main(src, dst):
    rows = Document(src).sheets[0].tables[0].rows(values_only=True)
    idx = {}
    for i, h in enumerate(rows[0]):
        if isinstance(h, str) and h.strip() and h not in idx:
            idx[h] = i

    def get(row, name):
        i = idx.get(name)
        if i is None or i >= len(row) or row[i] is None:
            return ""
        s = str(row[i]).strip()
        return "" if s.strip("- ") == "" else s

    def cpf(s):
        d = re.sub(r"\D", "", s)
        if not d:
            return ""
        d = d.zfill(11)
        return f"{d[0:3]}.{d[3:6]}.{d[6:9]}-{d[9:11]}" if len(d) == 11 else s

    def date(s):
        m = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{4})", s.strip())
        return f"{int(m.group(1)):02d}/{int(m.group(2)):02d}/{m.group(3)}" if m else ""

    def status(s):
        s = s.lower()
        if "demit" in s:
            return "DEMITIDO"
        if any(t in s for t in ("afast", "doen", "licen", "acidente", "matern")):
            return "AFASTADO"
        return "ATIVO"

    n = 0
    with open(dst, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(COLS)
        for row in rows[1:]:
            nome, c = get(row, "Nome"), cpf(get(row, "CPF"))
            if not nome or not c:
                continue
            w.writerow([c, nome, date(get(row, "Data nascimento")), get(row, "Sexo"), "",
                get(row, "PIS"), get(row, "CTPS"), get(row, "Serie CTPS"), get(row, "Cód eSocial"),
                date(get(row, "Admissão")), date(get(row, "Data Demissão")),
                get(row, "Descrição cargo") or get(row, "Descrição Função"), get(row, "CBO"),
                get(row, "Descrição Dpto"), get(row, "Descrição Serviço"), get(row, "Cód Serviço"),
                get(row, "Cidade"), get(row, "UF End"), get(row, "Celular"), get(row, "Telefone"),
                get(row, "Email"), status(get(row, "Situação"))])
            n += 1
    print(f"{n} funcionários -> {dst}")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
