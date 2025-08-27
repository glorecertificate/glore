'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { getCommentKey, getDraftCommentKey } from '@platejs/comment'
import { CommentPlugin, useCommentId } from '@platejs/comment/react'
import { differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns'
import { ArrowUpIcon, CheckIcon, MoreHorizontalIcon, PencilIcon, TrashIcon, XIcon } from 'lucide-react'
import { KEYS, nanoid, NodeApi, type Value } from 'platejs'
import {
  Plate,
  useEditorPlugin,
  useEditorRef,
  usePlateEditor,
  usePluginOption,
  type CreatePlateEditorOptions,
} from 'platejs/react'
import { useFormatter } from 'use-intl'

import { type Any } from '@repo/utils/types'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTranslations } from '@/hooks/use-translations'
import { cn } from '@/lib/utils'
import { Editor, EditorContainer } from '@rte/blocks/editor'
import { BasicMarksKit } from '@rte/kits/basic-marks'
import { discussionPlugin, type TDiscussion } from '@rte/kits/discussion'

export interface TComment {
  contentRich: Value
  createdAt: Date
  discussionId: string
  id: string
  isEdited: boolean
  userId: string
}

export const Comment = (props: {
  comment: TComment
  discussionLength: number
  editingId: string | null
  index: number
  setEditingId: React.Dispatch<React.SetStateAction<string | null>>
  documentContent?: string
  showDocumentContent?: boolean
  onEditorClick?: () => void
}) => {
  const {
    comment,
    discussionLength,
    documentContent,
    editingId,
    index,
    onEditorClick,
    setEditingId,
    showDocumentContent = false,
  } = props

  const editor = useEditorRef()
  const userInfo = usePluginOption(discussionPlugin, 'user', comment.userId)
  const currentUserId = usePluginOption(discussionPlugin, 'currentUserId')

  const resolveDiscussion = (id: string) => {
    const updatedDiscussions = editor.getOption(discussionPlugin, 'discussions').map(discussion => {
      if (discussion.id === id) {
        return { ...discussion, isResolved: true }
      }
      return discussion
    })
    editor.setOption(discussionPlugin, 'discussions', updatedDiscussions)
  }

  const removeDiscussion = (id: string) => {
    const updatedDiscussions = editor
      .getOption(discussionPlugin, 'discussions')
      .filter(discussion => discussion.id !== id)
    editor.setOption(discussionPlugin, 'discussions', updatedDiscussions)
  }

  const updateComment = (input: { id: string; contentRich: Value; discussionId: string; isEdited: boolean }) => {
    const updatedDiscussions = editor.getOption(discussionPlugin, 'discussions').map(discussion => {
      if (discussion.id === input.discussionId) {
        const updatedComments = discussion.comments.map(comment => {
          if (comment.id === input.id) {
            return {
              ...comment,
              contentRich: input.contentRich,
              isEdited: true,
              updatedAt: new Date(),
            }
          }
          return comment
        })
        return { ...discussion, comments: updatedComments }
      }
      return discussion
    })
    editor.setOption(discussionPlugin, 'discussions', updatedDiscussions)
  }

  const { tf } = useEditorPlugin(CommentPlugin)

  // Replace to your own backend or refer to potion
  const isMyComment = currentUserId === comment.userId

  const initialValue = comment.contentRich

  const commentEditor = useCommentEditor(
    {
      id: comment.id,
      value: initialValue,
    },
    [initialValue],
  )

  const onCancel = () => {
    setEditingId(null)
    commentEditor.tf.replaceNodes(initialValue, {
      at: [],
      children: true,
    })
  }

  const onSave = () => {
    void updateComment({
      id: comment.id,
      contentRich: commentEditor.children,
      discussionId: comment.discussionId,
      isEdited: true,
    })
    setEditingId(null)
  }

  const onResolveComment = () => {
    void resolveDiscussion(comment.discussionId)
    tf.comment.unsetMark({ id: comment.discussionId })
  }

  const isFirst = index === 0
  const isLast = index === discussionLength - 1
  const isEditing = editingId && editingId === comment.id

  const [hovering, setHovering] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <div onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
      <div className="relative flex items-center">
        <Avatar className="size-5">
          <AvatarImage alt={userInfo?.name} src={userInfo?.avatarUrl} />
          <AvatarFallback>{userInfo?.name?.[0]}</AvatarFallback>
        </Avatar>
        <h4 className="mx-2 text-sm leading-none font-semibold">{userInfo?.name}</h4>

        <div className="text-xs leading-none text-muted-foreground/80">
          <span className="mr-1">{useCommentDate(new Date(comment.createdAt))}</span>
          {comment.isEdited && <span>{'(edited)'}</span>}
        </div>

        {isMyComment && (hovering || dropdownOpen) && (
          <div className="absolute top-0 right-0 flex space-x-1">
            {index === 0 && (
              <Button
                className="h-6 p-1 text-muted-foreground"
                onClick={onResolveComment}
                type="button"
                variant="ghost"
              >
                <CheckIcon className="size-4" />
              </Button>
            )}

            <CommentMoreDropdown
              comment={comment}
              dropdownOpen={dropdownOpen}
              onCloseAutoFocus={() => {
                setTimeout(() => {
                  commentEditor.tf.focus({ edge: 'endEditor' })
                }, 0)
              }}
              onRemoveComment={() => {
                if (discussionLength === 1) {
                  tf.comment.unsetMark({ id: comment.discussionId })
                  void removeDiscussion(comment.discussionId)
                }
              }}
              setDropdownOpen={setDropdownOpen}
              setEditingId={setEditingId}
            />
          </div>
        )}
      </div>

      {isFirst && showDocumentContent && (
        <div className="relative mt-1 flex pl-[32px] text-sm text-muted-foreground">
          {discussionLength > 1 && <div className="absolute top-[5px] left-3 h-full w-0.5 shrink-0 bg-muted" />}
          <div className="my-px w-0.5 shrink-0 bg-editor-highlight" />
          {documentContent && <div className="ml-2">{documentContent}</div>}
        </div>
      )}

      <div className="relative my-1 pl-[26px]">
        {!isLast && <div className="absolute top-0 left-3 h-full w-0.5 shrink-0 bg-muted" />}
        <Plate editor={commentEditor} readOnly={!isEditing}>
          <EditorContainer variant="comment">
            <Editor className="w-auto grow" onClick={() => onEditorClick?.()} variant="comment" />

            {isEditing && (
              <div className="ml-auto flex shrink-0 gap-1">
                <Button
                  className="size-[28px]"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation()
                    void onCancel()
                  }}
                  size="icon"
                  variant="ghost"
                >
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-[50%] bg-primary/40">
                    <XIcon className="size-3 stroke-[3px] text-background" />
                  </div>
                </Button>

                <Button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation()
                    void onSave()
                  }}
                  size="icon"
                  variant="ghost"
                >
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-[50%] bg-brand">
                    <CheckIcon className="size-3 stroke-[3px] text-background" />
                  </div>
                </Button>
              </div>
            )}
          </EditorContainer>
        </Plate>
      </div>
    </div>
  )
}

const CommentMoreDropdown = (props: {
  comment: TComment
  dropdownOpen: boolean
  setDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>
  setEditingId: React.Dispatch<React.SetStateAction<string | null>>
  onCloseAutoFocus?: () => void
  onRemoveComment?: () => void
}) => {
  const { comment, dropdownOpen, onCloseAutoFocus, onRemoveComment, setDropdownOpen, setEditingId } = props
  const editor = useEditorRef()
  const t = useTranslations('Editor')

  const selectedEditCommentRef = useRef<boolean>(false)

  const onDeleteComment = useCallback(() => {
    if (!comment.id) return

    const updatedDiscussions = editor.getOption(discussionPlugin, 'discussions').map(discussion => {
      if (discussion.id !== comment.discussionId) {
        return discussion
      }

      const commentIndex = discussion.comments.findIndex(c => c.id === comment.id)
      if (commentIndex === -1) {
        return discussion
      }

      return {
        ...discussion,
        comments: [...discussion.comments.slice(0, commentIndex), ...discussion.comments.slice(commentIndex + 1)],
      }
    })

    editor.setOption(discussionPlugin, 'discussions', updatedDiscussions)
    onRemoveComment?.()
  }, [comment.discussionId, comment.id, editor, onRemoveComment])

  const onEditComment = useCallback(() => {
    selectedEditCommentRef.current = true

    if (!comment.id) return

    setEditingId(comment.id)
  }, [comment.id, setEditingId])

  return (
    <DropdownMenu modal={false} onOpenChange={setDropdownOpen} open={dropdownOpen}>
      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
        <Button className={cn('h-6 p-1 text-muted-foreground')} variant="ghost">
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-48"
        onCloseAutoFocus={e => {
          if (selectedEditCommentRef.current) {
            onCloseAutoFocus?.()
            selectedEditCommentRef.current = false
          }
          return e.preventDefault()
        }}
      >
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={onEditComment}>
            <PencilIcon className="size-4" />
            {t('actions.editComment')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDeleteComment}>
            <TrashIcon className="size-4" />
            {t('actions.deleteComment')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const useCommentEditor = (options: Omit<CreatePlateEditorOptions, 'plugins'> = {}, deps: Any[] = []) => {
  const commentEditor = usePlateEditor(
    {
      id: 'comment',
      plugins: BasicMarksKit,
      value: [],
      ...options,
    },
    deps,
  )

  return commentEditor
}

export const CommentCreateForm = ({
  autoFocus = false,
  className,
  discussionId: discussionIdProp,
  focusOnMount = false,
}: {
  autoFocus?: boolean
  className?: string
  discussionId?: string
  focusOnMount?: boolean
}) => {
  const discussions = usePluginOption(discussionPlugin, 'discussions')
  const editor = useEditorRef()
  const commentId = useCommentId()
  const t = useTranslations('Editor')

  const discussionId = discussionIdProp ?? commentId

  const userInfo = usePluginOption(discussionPlugin, 'currentUser')
  const [commentValue, setCommentValue] = useState<Value | undefined>()
  const commentContent = useMemo(
    () => (commentValue ? NodeApi.string({ children: commentValue, type: KEYS.p }) : ''),
    [commentValue],
  )
  const commentEditor = useCommentEditor()

  useEffect(() => {
    if (commentEditor && focusOnMount) {
      commentEditor.tf.focus()
    }
  }, [commentEditor, focusOnMount])

  const onAddComment = useCallback(() => {
    if (!commentValue) return

    commentEditor.tf.reset()

    if (discussionId) {
      const discussion = discussions.find(d => d.id === discussionId)
      if (!discussion) {
        const newDiscussion: TDiscussion = {
          id: discussionId,
          comments: [
            {
              id: nanoid(),
              contentRich: commentValue,
              createdAt: new Date(),
              discussionId,
              isEdited: false,
              userId: editor.getOption(discussionPlugin, 'currentUserId'),
            },
          ],
          createdAt: new Date(),
          isResolved: false,
          userId: editor.getOption(discussionPlugin, 'currentUserId'),
        }

        editor.setOption(discussionPlugin, 'discussions', [...discussions, newDiscussion])
        return
      }

      const comment: TComment = {
        id: nanoid(),
        contentRich: commentValue,
        createdAt: new Date(),
        discussionId,
        isEdited: false,
        userId: editor.getOption(discussionPlugin, 'currentUserId'),
      }

      const updatedDiscussion = {
        ...discussion,
        comments: [...discussion.comments, comment],
      }

      const updatedDiscussions = discussions.filter(d => d.id !== discussionId).concat(updatedDiscussion)

      editor.setOption(discussionPlugin, 'discussions', updatedDiscussions)

      return
    }

    const commentsNodeEntry = editor.getApi(CommentPlugin).comment.nodes({ at: [], isDraft: true })

    if (commentsNodeEntry.length === 0) return

    const documentContent = commentsNodeEntry.map(([node]) => node.text).join('')

    const _discussionId = nanoid()
    const newDiscussion: TDiscussion = {
      id: _discussionId,
      comments: [
        {
          id: nanoid(),
          contentRich: commentValue,
          createdAt: new Date(),
          discussionId: _discussionId,
          isEdited: false,
          userId: editor.getOption(discussionPlugin, 'currentUserId'),
        },
      ],
      createdAt: new Date(),
      documentContent,
      isResolved: false,
      userId: editor.getOption(discussionPlugin, 'currentUserId'),
    }

    editor.setOption(discussionPlugin, 'discussions', [...discussions, newDiscussion])

    const id = newDiscussion.id

    commentsNodeEntry.forEach(([, path]) => {
      editor.tf.setNodes(
        {
          [getCommentKey(id)]: true,
        },
        { at: path, split: true },
      )
      editor.tf.unsetNodes([getDraftCommentKey()], { at: path })
    })
  }, [commentValue, commentEditor.tf, discussionId, editor, discussions])

  return (
    <div className={cn('flex w-full', className)}>
      <div className="mt-2 mr-1 shrink-0">
        <Avatar className="size-5">
          <AvatarImage alt={userInfo?.name} src={userInfo?.avatarUrl} />
          <AvatarFallback>{userInfo?.name?.[0]}</AvatarFallback>
        </Avatar>
      </div>

      <div className="relative flex grow gap-2">
        <Plate
          editor={commentEditor}
          onChange={({ value }) => {
            setCommentValue(value)
          }}
        >
          <EditorContainer variant="comment">
            <Editor
              autoComplete="off"
              autoFocus={autoFocus}
              className="min-h-[25px] grow pt-0.5 pr-8"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onAddComment()
                }
              }}
              placeholder={t('actions.reply')}
              variant="comment"
            />

            <Button
              className="absolute right-0.5 bottom-0.5 ml-auto size-6 shrink-0"
              disabled={commentContent.trim().length === 0}
              onClick={e => {
                e.stopPropagation()
                onAddComment()
              }}
              size="icon"
              variant="ghost"
            >
              <div className="flex size-6 items-center justify-center rounded-full">
                <ArrowUpIcon />
              </div>
            </Button>
          </EditorContainer>
        </Plate>
      </div>
    </div>
  )
}

export const useCommentDate = (date: Date) => {
  const t = useFormatter()

  const now = new Date()
  const diffMinutes = differenceInMinutes(now, date)
  const diffHours = differenceInHours(now, date)
  const diffDays = differenceInDays(now, date)

  if (diffMinutes < 60) {
    return `${diffMinutes}m`
  }
  if (diffHours < 24) {
    return `${diffHours}h`
  }
  if (diffDays < 2) {
    return `${diffDays}d`
  }

  return t.dateTime(date, {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}
