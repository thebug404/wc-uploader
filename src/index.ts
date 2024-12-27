import "./uploader/uploader"

const $form = document.querySelector("form") as HTMLFormElement
const $uploader = document.querySelector("x-uploader")

$uploader?.addEventListener("change", () => {
  const files = $uploader.value

  files.forEach((file) => {
    console.log(file)
  })
})

$form.addEventListener("submit", (e) => {
  e.preventDefault()

  const formData = new FormData($form)

  const files = formData.getAll("files")

  files.forEach((file) => {
    console.log(file);
  })
})
