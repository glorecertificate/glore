'use client'

import { useState } from 'react'

import { CopilotPlugin } from '@platejs/ai/react'
import { type ChatRequestOptions } from 'ai'
import { Check, ChevronsUpDown, ExternalLinkIcon, Eye, EyeOff, Settings, Wand2Icon } from 'lucide-react'
import { useEditorRef } from 'platejs/react'

import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ApiRoute } from '@/lib/navigation'
import { cn } from '@/lib/utils'
import { aiChatPlugin } from '@rte/kits/ai'

interface Model {
  label: string
  value: string
}

export const models: Model[] = [
  { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
  { label: 'gpt-4o', value: 'gpt-4o' },
  { label: 'gpt-4-turbo', value: 'gpt-4-turbo' },
  { label: 'gpt-4', value: 'gpt-4' },
  { label: 'gpt-3.5-turbo', value: 'gpt-3.5-turbo' },
  { label: 'gpt-3.5-turbo-instruct', value: 'gpt-3.5-turbo-instruct' },
]

export const SettingsDialog = () => {
  const editor = useEditorRef()

  const [tempModel, setTempModel] = useState(models[0])
  const [tempKeys, setTempKeys] = useState<Record<string, string>>({
    openai: '',
    uploadthing: '',
  })
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})
  const [open, setOpen] = useState(false)
  const [openModel, setOpenModel] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const options = editor.getOptions(aiChatPlugin) as Record<'chatOptions', ChatRequestOptions>

    if (!options.chatOptions) {
      console.warn('AI chat options not found. Please ensure the AI plugin is configured correctly.')
      return
    }

    editor.setOption(aiChatPlugin, 'chatOptions', {
      ...options.chatOptions,
      api: ApiRoute.AiCommand,
      body: {
        ...options.chatOptions.body,
        apiKey: tempKeys.openai,
        model: tempModel.value,
      },
    })

    setOpen(false)

    const completeOptions = editor.getOptions(CopilotPlugin).completeOptions ?? {}
    editor.setOption(CopilotPlugin, 'completeOptions', {
      ...completeOptions,
      body: {
        ...completeOptions.body,
        apiKey: tempKeys.openai,
        model: tempModel.value,
      },
    })
  }

  const toggleKeyVisibility = (key: string) => {
    setShowKey(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const renderApiKeyInput = (service: string, label: string) => (
    <div className="group relative">
      <div className="flex items-center justify-between">
        <label
          className={`
            absolute top-1/2 block -translate-y-1/2 cursor-text px-1 text-sm text-muted-foreground/70 transition-all
            group-focus-within:pointer-events-none group-focus-within:top-0 group-focus-within:cursor-default group-focus-within:text-xs
            group-focus-within:font-medium group-focus-within:text-foreground
            has-[+input:not(:placeholder-shown)]:pointer-events-none has-[+input:not(:placeholder-shown)]:top-0
            has-[+input:not(:placeholder-shown)]:cursor-default has-[+input:not(:placeholder-shown)]:text-xs
            has-[+input:not(:placeholder-shown)]:font-medium has-[+input:not(:placeholder-shown)]:text-foreground
          `}
          htmlFor={label}
        >
          <span className="inline-flex bg-background px-2">{label}</span>
        </label>
        <Button asChild className="absolute top-0 right-[28px] h-full" size="icon" variant="ghost">
          <a
            className="flex items-center"
            href={service === 'openai' ? 'https://platform.openai.com/api-keys' : 'https://uploadthing.com/dashboard'}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLinkIcon className="size-4" />
            <span className="sr-only">
              {'Get '}
              {label}
            </span>
          </a>
        </Button>
      </div>

      <Input
        className="pr-10"
        data-1p-ignore
        id={label}
        onChange={e => setTempKeys(prev => ({ ...prev, [service]: e.target.value }))}
        placeholder=""
        type={showKey[service] ? 'text' : 'password'}
        value={tempKeys[service]}
      />
      <Button
        className="absolute top-0 right-0 h-full"
        onClick={() => toggleKeyVisibility(service)}
        size="icon"
        type="button"
        variant="ghost"
      >
        {showKey[service] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        <span className="sr-only">
          {showKey[service] ? 'Hide' : 'Show'} {label}
        </span>
      </Button>
    </div>
  )

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button
          className={cn(
            'group fixed right-4 bottom-4 z-50 size-10 overflow-hidden',
            'rounded-full shadow-md hover:shadow-lg',
          )}
          size="icon"
        >
          <Settings className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl">{'Settings'}</DialogTitle>
          <DialogDescription>{'Configure your API keys and preferences.'}</DialogDescription>
        </DialogHeader>

        <form className="space-y-10" onSubmit={handleSubmit}>
          {/* AI Settings Group */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-purple-100 p-2 dark:bg-purple-900">
                <Wand2Icon className="size-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-semibold">{'AI'}</h4>
            </div>

            <div className="space-y-4">
              {renderApiKeyInput('openai', 'OpenAI API key')}

              <div className="group relative">
                <label
                  className={`
                    absolute start-1 top-0 z-10 block -translate-y-1/2 bg-background px-2 text-xs font-medium text-foreground
                    group-has-disabled:opacity-50
                  `}
                  htmlFor="select-model"
                >
                  {'Model'}
                </label>
                <Popover onOpenChange={setOpenModel} open={openModel}>
                  <PopoverTrigger asChild id="select-model">
                    <Button
                      aria-expanded={openModel}
                      className="w-full justify-between"
                      role="combobox"
                      size="lg"
                      variant="outline"
                    >
                      <code>{tempModel.label}</code>
                      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search model..." />
                      <CommandEmpty>{'No model found.'}</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {models.map(m => (
                            <CommandItem
                              key={m.value}
                              onSelect={() => {
                                setTempModel(m)
                                setOpenModel(false)
                              }}
                              value={m.value}
                            >
                              <Check
                                className={cn('mr-2 size-4', tempModel.value === m.value ? 'opacity-100' : 'opacity-0')}
                              />
                              <code>{m.label}</code>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Upload Settings Group */}
          {/* <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-red-100 p-2 dark:bg-red-900">
                <Upload className="size-4 text-red-600 dark:text-red-400" />
              </div>
              <h4 className="font-semibold">Upload</h4>
            </div>

            <div className="space-y-4">
              {renderApiKeyInput('uploadthing', 'Uploadthing API key')}
            </div>
          </div> */}

          <Button className="w-full" size="lg" type="submit">
            {'Save changes'}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground">
          {'Not stored anywhere. Used only for current session requests.'}
        </p>
      </DialogContent>
    </Dialog>
  )
}
