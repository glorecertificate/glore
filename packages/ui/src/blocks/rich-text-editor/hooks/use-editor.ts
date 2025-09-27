'use client'

import { useEditorRef, usePlateState } from 'platejs/react'

import { type RichTextEditor } from '../types'

export const useEditor = () => useEditorRef<RichTextEditor>()

export const useEditorState = usePlateState
