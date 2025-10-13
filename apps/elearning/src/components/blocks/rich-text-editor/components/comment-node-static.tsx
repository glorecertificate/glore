import { SlateLeaf, type SlateLeafProps, type TCommentText } from 'platejs'

export const CommentLeafStatic = (props: SlateLeafProps<TCommentText>) => (
  <SlateLeaf {...props} className="border-b-2 border-b-editor-highlight/35 bg-editor-highlight/15">
    {props.children}
  </SlateLeaf>
)
