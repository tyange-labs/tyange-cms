export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  const formData = await readMultipartFormData(event)

  if (!formData) {
    throw createError({
      statusCode: 400,
      message: 'No file uploaded',
    })
  }

  const authHeader = getRequestHeader(event, 'Authorization')

  const newFormData = new FormData()
  formData.forEach((part) => {
    if (part.name === 'file' && part.data) {
      const blob = new Blob([part.data], { type: part.type })
      newFormData.append('file', blob, part.filename || 'icon.svg')
    }
  })

  try {
    return await $fetch(
      `${config.public.tyangeCmsApiBase}/upload-image?image_type=portfolio_icon`,
      {
        method: 'POST',
        headers: {
          Authorization: authHeader || '',
        },
        body: newFormData,
      },
    )
  } catch (err: any) {
    const statusCode = err?.response?.status || err?.statusCode || 500
    const errorData = err?.response?._data || err?.data || err?.message || 'Unknown error'

    console.error('[upload-icon] CMS API error:', statusCode, errorData)

    throw createError({
      statusCode,
      message: typeof errorData === 'string' ? errorData : JSON.stringify(errorData),
    })
  }
})
