
with open('country.txt') as f:
    with open('country.yaml', 'w') as yaml:
        pk = 0
        for line in f:
            pk += 1
            name, code = line.strip().split(';')

            yaml.write('- model: api.country\n')
            yaml.write('  pk: {}\n'.format(pk))
            yaml.write('  fields:\n')

            yaml.write('    code: "{}"\n'.format(code))
            yaml.write('    name: "{}"\n'.format(name))
