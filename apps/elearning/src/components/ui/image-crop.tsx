// 'use client'

// import 'react-image-crop/dist/ReactCrop.css'

// import { type SyntheticEvent, useCallback, useRef, useState } from 'react'

// import { CropIcon, Trash2Icon } from 'lucide-react'
// import ReactCrop, { type Crop, centerCrop, makeAspectCrop, type PixelCrop } from 'react-image-crop'
// import { type FileWithPath } from 'use-file-picker/types'

// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
// import { Button } from '@/components/ui/button'
// import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from '@/components/ui/dialog'

// export type FileWithPreview = FileWithPath & {
//   preview: string
// }

// interface ImageCropProps {
//   dialogOpen: boolean
//   setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
//   selectedFile: FileWithPreview | null
//   setSelectedFile: React.Dispatch<React.SetStateAction<FileWithPreview | null>>
// }

// export const ImageCrop = ({ dialogOpen, setDialogOpen, selectedFile, setSelectedFile }: ImageCropProps) => {
//   const aspect = 1

//   const imgRef = useRef<HTMLImageElement | null>(null)

//   const [crop, setCrop] = useState<Crop>()
//   const [croppedImageUrl, setCroppedImageUrl] = useState('')
//   const [croppedImage, setCroppedImage] = useState('')

//   const onImageLoad = useCallback((e: SyntheticEvent<HTMLImageElement>) => {
//     if (!aspect) return
//     const { width, height } = e.currentTarget
//     setCrop(centerAspectCrop(width, height, aspect))
//   }, [])

//   // biome-ignore lint: exhaustive-deps
//   const onCropComplete = useCallback((crop: PixelCrop) => {
//     if (imgRef.current && crop.width && crop.height) {
//       const croppedImageUrl = getCroppedImg(imgRef.current, crop)
//       setCroppedImageUrl(croppedImageUrl)
//     }
//   }, [])

//   const getCroppedImg = useCallback((image: HTMLImageElement, crop: PixelCrop) => {
//     const canvas = document.createElement('canvas')
//     const scaleX = image.naturalWidth / image.width
//     const scaleY = image.naturalHeight / image.height

//     canvas.width = crop.width * scaleX
//     canvas.height = crop.height * scaleY

//     const ctx = canvas.getContext('2d')

//     if (ctx) {
//       ctx.imageSmoothingEnabled = false

//       ctx.drawImage(
//         image,
//         crop.x * scaleX,
//         crop.y * scaleY,
//         crop.width * scaleX,
//         crop.height * scaleY,
//         0,
//         0,
//         crop.width * scaleX,
//         crop.height * scaleY
//       )
//     }

//     return canvas.toDataURL('image/png', 1.0)
//   }, [])

//   const onCrop = useCallback(() => {
//     try {
//       setCroppedImage(croppedImageUrl)
//       setDialogOpen(false)
//     } catch {
//       alert('Something went wrong!')
//     }
//   }, [croppedImageUrl, setDialogOpen])

//   return (
//     <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
//       <DialogTrigger>
//         <Avatar className="size-36 cursor-pointer ring-2 ring-slate-200 ring-offset-2">
//           <AvatarImage alt="@shadcn" src={croppedImage ? croppedImage : selectedFile?.preview} />
//           <AvatarFallback>CN</AvatarFallback>
//         </Avatar>
//       </DialogTrigger>
//       <DialogContent className="gap-0 p-0">
//         <div className="size-full p-6">
//           <ReactCrop
//             aspect={aspect}
//             className="w-full"
//             crop={crop}
//             onChange={(_, percentCrop) => setCrop(percentCrop)}
//             onComplete={c => onCropComplete(c)}
//           >
//             <Avatar className="size-full rounded-none">
//               <AvatarImage
//                 alt="Image Cropper Shell"
//                 className="size-full rounded-none"
//                 onLoad={onImageLoad}
//                 ref={imgRef}
//                 src={selectedFile?.preview}
//               />
//               <AvatarFallback className="size-full min-h-[460px] rounded-none">Loading...</AvatarFallback>
//             </Avatar>
//           </ReactCrop>
//         </div>
//         <DialogFooter className="justify-center p-6 pt-0">
//           <DialogClose asChild>
//             <Button
//               className="w-fit"
//               onClick={() => {
//                 setSelectedFile(null)
//               }}
//               size={'sm'}
//               type="reset"
//               variant={'outline'}
//             >
//               <Trash2Icon className="mr-1.5 size-4" />
//               Cancel
//             </Button>
//           </DialogClose>
//           <Button className="w-fit" onClick={onCrop} size={'sm'} type="submit">
//             <CropIcon className="mr-1.5 size-4" />
//             Crop
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   )
// }

// // Helper function to center the crop
// export function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
//   return centerCrop(
//     makeAspectCrop(
//       {
//         unit: '%',
//         width: 50,
//         height: 50,
//       },
//       aspect,
//       mediaWidth,
//       mediaHeight
//     ),
//     mediaWidth,
//     mediaHeight
//   )
// }
