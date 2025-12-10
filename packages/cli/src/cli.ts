#!/usr/bin/env tsx

import { program } from 'commander'

import { build } from './commands/build'
import { check } from './commands/check'
import { dev } from './commands/dev'
import { edge } from './commands/edge'
import { email } from './commands/email'
import { typegen } from './commands/typegen'
import { cli } from './config'

import 'dotenv/config'

program.name(cli.name).description(cli.description).usage('<command> [options]')
program.addCommand(build)
program.addCommand(check)
program.addCommand(dev)
program.addCommand(edge)
program.addCommand(email)
program.addCommand(typegen)
program.showHelpAfterError()
program.helpOption('-h, --help', 'Display this help message')
program.helpCommand('help [command]', 'Display help for a command')
program.parse()
