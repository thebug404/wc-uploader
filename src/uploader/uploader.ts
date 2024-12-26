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

  @property({ attribute: "error-message-min" })
  override errorMessageMin = "The minimum number of files allowed is {min}";

  @property({ attribute: "error-message-max" })
  override errorMessageMax = "The maximum number of files allowed is {max}";

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
    console.log(this.required, this.value.length);

    if (this.required && this.value.length === 0) {
      this.setCustomValidity(this.errorMessageRequired);
      return false;
    }

    if (this.min && this.value.length < Number(this.min)) {
      console.log(this.min, this.value.length);

      const message = this.errorMessageMin.replace("{min}", this.min.toString());
      this.setCustomValidity(message);

      return false;
    }

    if (this.max && this.value.length > Number(this.max)) {
      const message = this.errorMessageMax.replace("{max}", this.max.toString());
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
            <label class="input__main" tabindex="0">
              <div class="input__icon">
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
              </div>

              <div class="input__text">
                <p class="input__text-primary">Arrastrar y soltar archivos aquí</p>
                <p class="input__text-secondary">Cantidad de archivos y peso máximo</p>
              </div>

              <div class="input__divider"></div>

              <div class="input__action">
                <span class="input__action-text">o bien</span>
                <a href="#" class="input__action-link">Buscar archivos</a>
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
                ${isError ? this.validationMessage : this.hint}
              </p>
            `;
          })}

          <table class="file-list">
            <tbody>
              ${this.value.map((file) => {
                return html`
                  <tr>
                    <td class="file-list__item file-list__name">
                      ${file.name}
                    </td>
                    <td class="file-list__item file-list__size">
                      ${formatFileSize(file.size)}
                    </td>
                    <td class="file-list__item">
                      <span class="file-list__status">
                        <span class="file-list__status-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                        </span>
                        <span class="file-list__status-text">Listo</span>
                      </span>
                    </td>
                    <td class="file-list__item file-list__delete">
                      <button
                        class="file-list__delete--btn"
                        aria-label="Eliminar archivo"
                        @click=${() => {
                          const files = this.value.filter((f) => f !== file);
                          this.setValue(files);
                        }}
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
