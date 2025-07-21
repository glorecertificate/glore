import { BaseCommentPlugin } from '@platejs/comment'

import { CommentLeafStatic } from '#rte/blocks/comment-node-static'

export const BaseCommentKit = [BaseCommentPlugin.withComponent(CommentLeafStatic)]
