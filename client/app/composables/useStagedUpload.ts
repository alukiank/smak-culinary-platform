import { onBeforeUnmount } from 'vue'
import { useCloudinary } from './useCloudinary'

export interface StagedFile {
  id?: string        // Cloudinary publicId (for already existing/saved images)
  file?: File        // Real file object (for newly selected images)
  preview: string    // Blob URL or Cloudinary URL
}

/**
 * useStagedUpload
 * Centralized logic for "Delayed/Staged" image uploads.
 * Use this in any component that needs local previews before final submission.
 */
export const useStagedUpload = () => {
  const { upload, isUploading, uploadProgress } = useCloudinary()
  const stagedFiles = ref<StagedFile[]>([])

  // Clean up Blob URLs to prevent memory leaks
  const cleanup = () => {
    stagedFiles.value.forEach(item => {
      if (item.preview.startsWith('blob:')) {
        URL.revokeObjectURL(item.preview)
      }
    })
  }

  onBeforeUnmount(cleanup)

  const addFiles = (files: File[]) => {
    files.forEach(file => {
      stagedFiles.value.push({
        file,
        preview: URL.createObjectURL(file)
      })
    })
  }

  const removeFile = (index: number) => {
    const item = stagedFiles.value[index]
    if (item && item.preview.startsWith('blob:')) {
      URL.revokeObjectURL(item.preview)
    }
    stagedFiles.value.splice(index, 1)
  }

  const moveFile = (from: number, to: number) => {
    const item = stagedFiles.value[from]
    if (!item) return
    
    stagedFiles.value.splice(from, 1)
    stagedFiles.value.splice(to, 0, item)
  }

  /**
   * Final step: Uploads all new files to Cloudinary.
   * Returns an array of all publicIds (newly uploaded + already existing).
   */
  const executeUpload = async (): Promise<string[]> => {
    const finalIds: string[] = []

    for (const item of stagedFiles.value) {
      if (item.id) {
        // Already on Cloudinary
        finalIds.push(item.id)
      } else if (item.file) {
        // Needs upload
        const result = await upload(item.file)
        if (result) {
          finalIds.push(result.publicId)
        }
      }
    }

    return finalIds
  }

  return {
    stagedFiles,
    isUploading,
    uploadProgress,
    addFiles,
    removeFile,
    moveFile,
    executeUpload,
    cleanup
  }
}
