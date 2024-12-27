import { customElement, property, query } from "lit/decorators.js";
import { PropertyValueMap, css, html, unsafeCSS } from "lit";
import { when } from "lit/directives/when.js";

import styles from "./uploader.css?inline";

import { executeWithDelay } from "../utils/executeWithDelay";
import { FormControl } from "../internals/form-control";

declare global {
  interface HTMLElementTagNameMap {
    "x-uploader": XUploader;
  }
}

/**
 * Convierte un tamaño en bytes a un formato legible.
 * @param bytes - El tamaño en bytes.
 * @param decimals - Número de decimales a mostrar (opcional, por defecto es 2).
 * @returns Una cadena con el tamaño formateado.
 */
function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024; // Tamaño base para conversión
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const formattedSize = (bytes / Math.pow(k, i)).toFixed(decimals);

  return `${formattedSize} ${sizes[i]}`;
}

const FIVE_MB = 1024 * 1024 * 5; // 5MB

@customElement("x-uploader")
export class XUploader extends FormControl<File[]> {
  static styles = css`${unsafeCSS(styles)}`;

  @query(".input__field")
  private _input!: HTMLInputElement;

  @property()
  override value: File[] = [];

  @property()
    label: string | null = null;

  @property()
    placeholder: string | null = null;

  @property()
    hint: string | null = null;

  @property({ type: Boolean })
    multiple = false;

  @property()
    accept: string | null = null;

  @property()
  override max = "1";

  @property({ attribute: "error-message-max" })
  override errorMessageMax = "The maximum number of files allowed is {max}";

  @property({ type: Number, attribute: "max-file-size" })
    maxFileSize = FIVE_MB;

  @property({ attribute: "error-message-max-file-size" })
    errorMessageMaxFileSize = "The file size exceeds the {maxFileSize} limit";

  connectedCallback(): void {
    super.connectedCallback();

    this.form?.addEventListener("reset", this.reset.bind(this));
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    this.form?.removeEventListener("reset", this.reset.bind(this));
  }

  protected firstUpdated(): void {
    executeWithDelay(() => this.checkValidity());
  }

  protected updated(changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    if (changedProperties.has("value")) {
      executeWithDelay(() => this.setValue(this.value));
    }
  }

  reset(): void {
    this.setValue([]);

    this._dirty = false;
    this._touched = false;
  }

  checkValidity(): boolean {
    if (this.required && this.value.length === 0) {
      this.setCustomValidity(this.errorMessageRequired);
      return false;
    }

    if (this.max && this.value.length > Number(this.max)) {
      const message = this.errorMessageMax.replace("{max}", this.max.toString());
      this.setCustomValidity(message);

      return false;
    }

    if (this.value.some((file) => file.size > this.maxFileSize)) {
      const message = this.errorMessageMaxFileSize.replace("{maxFileSize}", formatFileSize(this.maxFileSize));
      this.setCustomValidity(message);

      return false;
    }

    this.setCustomValidity(null);

    return true;
  }

  setValue(value: File[]): void {
    this.value = value;

    const isValid = this.checkValidity();

    if (!isValid) {
      return;
    }

    const formData = new FormData();

    for (const file of value) {
      formData.append(this.name, file);
    }

    this.internals.setFormValue(formData);
  }

  private _onClick(): void {
    this.markAsTouched();
    this._input.focus();
  }

  private _onInput(ev: InputEvent): void {
    this.markAsDirty();

    const filesMap = (ev.target as HTMLInputElement).files;
    const files = Array.from(filesMap || []);

    this.setValue(files);

    const event = new CustomEvent("change", {
      detail: { value: files },
      bubbles: true,
      composed: true
    });

    this.dispatchEvent(event);
  }

  private _onBlur(): void {
    this.markAsTouched();
  }

  private onRemoveFile(file: File): void {
    const files = this.value.filter((f) => f !== file);
    this.setValue(files);

    const event = new CustomEvent("change", {
      detail: { value: files },
      bubbles: true,
      composed: true
    });

    this.dispatchEvent(event);
  }

  private onDragOver(ev: DragEvent): void {
    ev.preventDefault();
    ev.stopPropagation();

    (ev.currentTarget as HTMLElement)?.classList.add("dragover");
  }

  private onDrop(ev: DragEvent): void {
    ev.preventDefault();
    ev.stopPropagation();

    (ev.currentTarget as HTMLElement)?.classList.remove("dragover");

    if (ev.type.includes("dragleave") && ev.type.includes("dragend")) {
      return;
    }

    const files = Array.from(ev.dataTransfer?.files || [])
      .filter((file) => {
        if (!this.accept) {
          return true;
        }

        const accept = this.accept.split(",").map((type) => type.trim());
        const fileType = file.type;
        const fileExtension = file.name.split(".").pop();

        return accept.includes(fileType) || accept.includes(`.${fileExtension}`);
      });

    this.setValue(files);

    const event = new CustomEvent("change", {
      detail: { value: files },
      bubbles: true,
      composed: true
    });

    this.dispatchEvent(event);
  }

  protected render(): unknown {
    const isError = (this.touched || this.dirty) && this.validationMessage != null;

    return html`
      <div class="input ${isError ? "error" : ""}">
        <div class="input__wrapper">
          <!-- Label -->
          ${when(this.label, () => {
            return html`
              <span class="input__label" @click=${this._onClick}>${this.label}</span>
            `;
          })}

          <div class="input__container">
            <label
              class="input__main"
              tabindex="0"
              @drop=${this.onDrop}
              @dragleave=${this.onDrop}
              @dragend=${this.onDrop}
              @dragover=${this.onDragOver}
              @dragenter=${this.onDragOver}
            >
              <div class="input__icon">
                ${
                  when(
                    this.value.length > 0,
                    () => html`
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="45"
                        height="45"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        class="icon icon-tabler icons-tabler-filled icon-tabler-folder"
                      >
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M9 3a1 1 0 0 1 .608 .206l.1 .087l2.706 2.707h6.586a3 3 0 0 1 2.995 2.824l.005 .176v8a3 3 0 0 1 -2.824 2.995l-.176 .005h-14a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-11a3 3 0 0 1 2.824 -2.995l.176 -.005h4z" />
                      </svg>
                    `,
                    () => html`
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="45"
                        height="45"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-folder-closed"
                      >
                        <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
                        <path d="M2 10h20"/>
                      </svg>
                    `
                  )
                }
              </div>

              <div class="input__text">
                <p class="input__text-primary">
                  ${
                    when(
                      this.value.length > 0,
                      () => "Archivos cargados",
                      () => "Arrastrar y soltar archivos aquí"
                    )
                  }
                </p>
                <p class="input__text-secondary">
                   Hasta ${when(Number(this.max) > 1, () => `${this.max} archivos`, () => "1 archivo")} y máx ${formatFileSize(Number(this.maxFileSize))}
                </p>
              </div>

              <div class="input__divider"></div>

              <div class="input__action">
                <span class="input__action-text">
                  ${
                    when(
                      this.value.length > 0,
                      () => "¿Quieres agregar más?",
                      () => "o bien"
                    )
                  }
                </span>
                <span class="input__action-link">Buscar archivos</span>
              </div>

              <input
                type="file"
                class="input__field"
                name=${this.name}
                ?disabled=${this.disabled}
                ?required=${this.required}
                ?multiple=${this.multiple}
                @input=${this._onInput}
                @blur=${this._onBlur}
                accept=${this.accept}
              />
            </label>
          </div>
        </div>

        ${when(this.hint || isError, () => {
            return html`
              <p class="input__message">
                ${isError ? this.validationMessage : this.hint?.replace("{accept}", this.accept || "")}
              </p>
            `;
          })}

          <table class="file-list">
            <tbody>
              ${this.value.map((file) => {
                return html`
                  <tr class="file-list__row">
                    <td class="file-list__item file-list__name">
                      ${file.name}
                    </td>
                    <td class="file-list__item file-list__size">
                      ${formatFileSize(file.size)}
                    </td>
                    <td class="file-list__item">
                      <span class="file-list__status ${file.size > this.maxFileSize ? "file-list__status--error" : "file-list__status--success"}">
                        <span class="file-list__status-icon">
                          ${
                            when(
                              file.size > this.maxFileSize,
                              () => html`
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  class="lucide lucide-circle-alert"
                                >
                                  <circle cx="12" cy="12" r="10"/>
                                  <line x1="12" x2="12" y1="8" y2="12"/>
                                  <line x1="12" x2="12.01" y1="16" y2="16"/>
                                </svg>
                              `,
                              () => html`
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  class="lucide lucide-circle-check"
                                >
                                  <circle cx="12" cy="12" r="10"/>
                                  <path d="m9 12 2 2 4-4"/>
                                </svg>
                              `
                            )
                          }
                        </span>
                        <span class="file-list__status-text">
                          ${
                            when(
                              file.size > this.maxFileSize,
                              () => "Fallido",
                              () => "Listo"
                            )
                          }
                        </span>
                      </span>
                    </td>
                    <td class="file-list__item file-list__delete">
                      <button
                        class="file-list__delete--btn"
                        aria-label="Eliminar archivo"
                        @click=${() => this.onRemoveFile(file)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          class="lucide lucide-trash-2"
                        >
                          <path d="M3 6h18"/>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                          <line x1="10" x2="10" y1="11" y2="17"/>
                          <line x1="14" x2="14" y1="11" y2="17"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                `;
              })}
            </tbody>
          </table>
      </div>
    `;
  }
}
