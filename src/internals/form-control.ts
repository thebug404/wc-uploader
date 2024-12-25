import { property, query, state } from "lit/decorators.js";
import { LitElement } from "lit";

export abstract class FormControl<T> extends LitElement {
  @query(".input__main")
  protected _$container: HTMLDivElement | undefined;

  /**
   * Indicates whether the form is associated with the custom element.
   */
  protected static formAssociated = true;

  /**
   * Provides access to the internals of the custom element.
   * For more information, see https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/attachInternals
   */
  protected readonly internals = this.attachInternals();

  /**
   * The name of the input.
   */
  @property()
  name!: string;

  /**
   * The value of the input.
   */
  @property()
  value!: T;

  /**
   * Indicate the input is required.
   */
  @property({ type: Boolean, reflect: true })
  required!: boolean;

  /**
   * The error message to display when the input is required.
   */
  @property({ attribute: "error-message-required" })
  errorMessageRequired = "This field is required";

  /**
   * The minimum length of the input.
   */
  @property({ reflect: true })
  min!: string;

  @property({ attribute: "error-message-min" })
  errorMessageMin = "The value must be greater than or equal to {min}";

  /**
   * The maximum length of the input.
   */
  @property({ reflect: true })
  max!: string;

  @property({ attribute: "error-message-max" })
  errorMessageMax = "The value must be less than or equal to {max}";

  /**
   * The minimum length of the input.
   */
  @property({ type: Number, attribute: "minlength", reflect: true })
  minLength!: number;

  @property({ attribute: "error-message-minlength" })
  errorMessageMinLength = "The value must be contain at least {minLength} characters";

  /**
   * The maximum length of the input.
   */
  @property({ type: Number, attribute: "maxlength", reflect: true })
  maxLength!: number;

  @property({ attribute: "error-message-maxlength" })
  errorMessageMaxLength = "The value must be contain at most {maxLength} characters"

  /**
   * The pattern of the input.
   */
  @property({ reflect: true })
  pattern!: string;

  @property({ attribute: "error-message-pattern" })
  errorMessagePattern = "The value does not match the pattern";

  /**
   * The type of the input.
   */
  @property()
  type!: string;

  /**
   * Indicate the input is disabled.
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  @state()
  protected _touched = false;

  @state()
  protected _dirty = false;

  @state()
  private _validationMessage!: string | null | undefined;

  /**
   * Indicate the input is touched. A control is touched if the user has
   * clicked on the control.
   */
  get touched(): boolean {
    return this._touched;
  }

  /**
   * Indicate the input is dirty. A control is dirty if the user has
   * modified the value in the control.
   */
  get dirty(): boolean {
    return this._dirty;
  }

  /**
   * Get the form element.
   */
  get form(): HTMLFormElement | null {
    return this.internals.form;
  }

  /**
   * The validation message. If this string is not empty an error is
   * displayed.
   */
  get validationMessage(): string | null | undefined {
    return this._validationMessage;
  }

  /**
   * Set the error message to display.
   *
   * @param message The validation message. If this string is not empty an error is displayed.
   */
  setCustomValidity(message: string | null | undefined): void {
    this._validationMessage = message;

    if (message == null) {
      return this.internals.setValidity({})
    }

    this.internals.setValidity(
      { customError: true },
      message,
      this._$container
    )
  }

  /**
   * Mark the input as touched.
   */
  markAsTouched(): void {
    this._touched = true;
  }

  /**
   * Mark the input as dirty.
   */
  markAsDirty(): void {
    this._dirty = true;
  }

  /**
   * Report the validity of the input.
   *
   * @returns Returns true if the input is valid.
   */
  reportValidity(): boolean {
    return this.checkValidity();
  }

  /**
   * Reset the input to its initial value.
   */
  abstract reset(): void;

  /**
   * Check the validity of the input.
   *
   * @returns Returns true if the input is valid.
   */
  abstract checkValidity(): boolean;

  /**
   * Set the value of the input.
   *
   * @param value The value of the input.
   */
  abstract setValue(value: T): void;
}
