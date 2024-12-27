# `XUploader`

The `XUploader` is a Web Components that allows you to upload files. It is a simple and easy-to-use component that can be used in any web application.

## Basic usage

```ts
import 'wc-uploader';
```

```html
<wc-uploader
  label="Upload file"
  accept=".png,.jpg,.jpeg"
  multiple
  max="5"
  required
  error-message-required="Please select a file"
  error-message-max="You can only upload up to {max} files"
></wc-uploader>
```
