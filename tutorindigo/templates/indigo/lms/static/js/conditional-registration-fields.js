/**
 * Copies all attributes from a source DOM element to a target DOM element.
 *
 * This function iterates over all attributes of the source element
 * and sets them on the target element, preserving names and values.
 *
 * @param {HTMLElement} source - The element from which to copy attributes.
 * @param {HTMLElement} target - The element to which attributes will be copied.
 */
function copyAttributes(source, target) {
  Array.from(source.attributes).forEach(attr => {
    target.setAttribute(attr.name, attr.value);
  });
}

/**
 * Converts an `<input>` element into a `<select>` element while preserving attributes and value.
 *
 * - Creates a new `<select>` element.
 * - Copies all attributes from the `<input>` element to the new `<select>`.
 * - Adds an empty default `<option>` to the `<select>`.
 * - Populates the `<select>` with the provided `options` list.
 * - Sets the selected value based on the existing input value.
 * - Replaces the `<input>` with the newly created `<select>`.
 * - Reattaches event listeners for dependent fields if applicable.
 *
 * @param {HTMLInputElement} inputElement - The `<input>` element to be converted.
 * @param {Array<string>} options - The list of options to populate the `<select>`.
 */
function convertToSelect(inputElement, options) {
    if (!inputElement || !Array.isArray(options)) return;

    const selectElement = document.createElement("select");
    const fieldName = inputElement.name;
    const fieldConfiguration = conditionalRegistrationFields?.[fieldName] ?? {};
    const dependentFields = getDependentFields(fieldConfiguration);

    // Copy all attributes from input to select
    copyAttributes(inputElement, selectElement)

    // Add an empty default option
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    selectElement.appendChild(emptyOption);

    // Populate select with options
    options.forEach(optionValue => {
        const option = document.createElement("option");
        option.value = optionValue;
        option.textContent = gettext(optionValue);
        selectElement.appendChild(option);
    });

    inputElement.replaceWith(selectElement);

    addFieldListeners(selectElement, dependentFields, fieldConfiguration);
}

/**
 * Converts a `<select>` element into an `<input>` field while preserving attributes and value.
 *
 * This function:
 * - Creates a new `<input>` element.
 * - Copies all attributes from the `<select>` element to the new `<input>`.
 * - Sets the input's value to match the currently selected value of the `<select>`.
 * - Replaces the `<select>` with the new `<input>` element.
 * - Reattaches event listeners for dependent fields.
 *
 * @param {HTMLSelectElement} selectElement - The `<select>` element to be converted.
 */
function convertToInput(selectElement) {
    if (!selectElement) return;

    const input = document.createElement("input");
    const fieldName = selectElement.name;
    const fieldConfiguration = conditionalRegistrationFields?.[fieldName] ?? {};
    const dependentFields = getDependentFields(fieldConfiguration);

    // Copy all attributes from select to input
    copyAttributes(selectElement, input)

    selectElement.replaceWith(input); // Replace the select with the input

    addFieldListeners(input, dependentFields, fieldConfiguration);
}

/**
 * Marks an element as required and optionally converts it into a select or input element.
 *
 * This function:
 * - Sets the `aria-required` and `required` attributes on the field.
 * - Converts the field to a `select` if options are provided; otherwise, keeps it as an `input`.
 * - Updates the associated label by adding a "required" indicator and removing any previous labels.
 *
 * @param {HTMLElement} element - The field container element.
 * @param {Array<string>|null} [options=null] - An array of options to convert the field into a select.
 */
function makeElementRequired(element, options = null){
    const labelElement = element.querySelector('label');
    const selectElement = element.querySelector('select') || element.querySelector('input');
    const name = selectElement.getAttribute('name');

    if (!selectElement) return;

    selectElement.setAttribute('aria-required', 'true');
    selectElement.setAttribute('required', '');

    if (Array.isArray(options) && options.length > 0) {
        convertToSelect(selectElement, options);
    } else {
        convertToInput(selectElement);
    }

    if (labelElement) {
        cleanLabel(labelElement);

        const requiredSpan = document.createElement('span');
        requiredSpan.className = 'label-required';
        requiredSpan.id = 'register-' + name + '-required-label';
        labelElement.appendChild(requiredSpan);
    }
}

/**
 * Marks an input/select field as optional and updates its associated label.
 *
 * This function:
 * - Clears the field value.
 * - Removes the `required` and `aria-required` attributes.
 * - Updates the label to indicate that the field is optional.
 *
 * @param {HTMLElement} element - The container element wrapping the label and input/select field.
 */
function makeElementOptional(element){
    const labelElement = element.querySelector('label');
    const selectElement = element.querySelector('select') || element.querySelector('input');
    const name = selectElement.getAttribute('name');

    if (selectElement) {
        selectElement.value = '';
        selectElement.selectedIndex = 0;
        selectElement.removeAttribute('required');
        selectElement.removeAttribute('aria-required');
    }

    if (labelElement) {
        const optionalSpan = document.createElement('span');
        optionalSpan.className = 'label-optional';
        optionalSpan.id = 'register-' + name + '--optional-label';

        cleanLabel(labelElement);
        labelElement.appendChild(optionalSpan);
    }
}

/**
 * Removes any existing required or optional indicators from a label element.
 *
 * This function:
 * - Searches for elements with the classes `.label-required` and `.label-optional` within the label.
 * - Removes these elements if they exist, ensuring the label does not have multiple status indicators.
 *
 * @param {HTMLElement} label - The label element to clean.
 */
function cleanLabel(label){
    label.querySelectorAll('.label-required, .label-optional').forEach(span => span.remove());
}

/**
 * Retrieves the container element for a given field.
 *
 * This function:
 * - Uses `conditionalRegistrationFields` to determine if the field has an alias.
 * - Attempts to find the container element by selecting elements with classes
 *   `.form-field.select-<fieldAlias>` or `.form-field.text-<fieldAlias>`.
 * - Returns the first matching container or `null` if none is found.
 *
 * @param {string} field - The name of the field to retrieve its container.
 * @returns {HTMLElement|null} The container element for the field, or `null` if not found.
 */
function getFieldContainer(field) {
    const fieldAlias = conditionalRegistrationFields[field]?.alias ?? field;

    return document.querySelector('.form-field.select-' + fieldAlias) || document.querySelector('.form-field.text-' + fieldAlias);
}

/**
 * Retrieves the input or select element associated with a given field name.
 *
 * This function:
 * - Uses `conditionalRegistrationFields` to determine if the field has an alias.
 * - Selects the corresponding element in the DOM using its `id` attribute.
 * - Defaults to using the field name if no alias is found.
 *
 * @param {string} field - The name of the field to retrieve.
 * @returns {HTMLElement|null} The corresponding input or select element, or `null` if not found.
 */
function getFieldElement(field) {
    const fieldAlias = conditionalRegistrationFields[field]?.alias ?? field;

    return document.querySelector('#register-' + fieldAlias);
}

/**
 * Reorders dependent fields by placing them immediately after their parent field in the DOM.
 *
 * This function:
 * - Retrieves the container element for each dependent field.
 * - Moves the dependent field container to be right after its parent field.
 * - Ensures correct hierarchical positioning of dependent fields in the form.
 *
 * @param {HTMLElement} fieldContainer - The container element of the main field.
 * @param {Array<string>} dependentFields - A list of dependent field names.
 */
function reorderDependentFields(fieldContainer, dependentFields) {
    const parentNode = fieldContainer.parentNode;
    if (!parentNode) return;

    const reorderField = (field) => {
        const dependentFieldContainer = getFieldContainer(field);

        if (dependentFieldContainer) {
            parentNode.insertBefore(dependentFieldContainer, fieldContainer.nextSibling);
        }
    }
    dependentFields.forEach(reorderField);
}

/**
 * Retrieves a unique list of dependent fields from a field configuration.
 *
 * This function:
 * - Checks if the given field configuration contains dependent fields.
 * - Extracts all dependent fields, flattens nested arrays, and removes duplicates.
 *
 * @param {Object} fieldConfiguration - The configuration object for a specific field.
 * @returns {Array<string>} A unique list of dependent field names.
 */
function getDependentFields(fieldConfiguration){
    return [...new Set(Object.values(fieldConfiguration?.dependent_fields ?? {}).flat())];
}

/**
 * Hides the specified dependent fields by making them optional and adding a 'hidden' class.
 *
 * This function:
 * - Retrieves the container element for each field.
 * - Calls `makeElementOptional` to remove the required attribute.
 * - Adds the `hidden` class to visually hide the field.
 *
 * @param {Array<string>} fields - A list of field names to hide.
 */
function hideDependentFields(fields) {
    const hideField = (field) => {
        const element = getFieldContainer(field);

        if (element && !element.classList.contains('hidden')) {
            makeElementOptional(element);
            element.classList.add('hidden');
        }
    }
    fields.forEach(hideField);
}

/**
 * Displays dependent fields that are allowed based on the current selection.
 *
 * This function:
 * - Iterates through a list of fields and checks if they are in the allowed fields list.
 * - If a field is allowed, it is made required and shown.
 * - Uses `makeElementRequired` to enforce field validation and set up the correct input type.
 *
 * @param {Array<string>} fields - List of dependent fields.
 * @param {Array<string>} allowedFields - List of fields that should be shown.
 */
function showDependentFields(fields, allowedFields) {
    const showField = (field) => {
        const element = getFieldContainer(field);

        if (element && allowedFields.includes(field)) {
            makeElementRequired(element, conditionalRegistrationFields[field]?.options ?? []);
            element.classList.remove('hidden');
        }
    }
    fields.forEach(showField);
}

/**
 * Adds event listeners to a field element to manage its dependent fields dynamically.
 *
 * This function:
 * - Listens for changes in the field's value and updates the visibility of dependent fields accordingly.
 * - Observes changes to the field's parent element's class attribute to trigger updates when necessary.
 * - Ensures dependent fields are hidden or shown based on the selected value.
 *
 * @param {HTMLElement} fieldElement - The input/select element being monitored.
 * @param {Array<string>} fields - A list of dependent fields associated with the fieldElement.
 * @param {Object} fieldConfiguration - The configuration object defining field dependencies.
 */
function addFieldListeners(fieldElement, fields, fieldConfiguration){
    const updateFields = () => {
        hideDependentFields(fields);
        showDependentFields(
            fields,
            fieldConfiguration?.dependent_fields?.[fieldElement.value] ?? [],
        );
    }
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.attributeName === "class") {
                updateFields();
            }
        });
    });
    fieldElement.addEventListener('change', () => updateFields());
    observer.observe(fieldElement.parentElement, { attributes: true });
}

/**
 * Initializes conditional registration fields by processing their dependencies.
 *
 * This function iterates over the `conditionalRegistrationFields` object, retrieves
 * each field's element, and applies logic to manage its dependent fields. It:
 * - Hides all dependent fields initially.
 * - Reorders dependent fields in the DOM.
 * - Attaches event listeners to dynamically handle changes.
 *
 * Fields without an associated input element are skipped.
 */
function initializeConditionalFields() {
    Object.entries(conditionalRegistrationFields).forEach(([registrationField, fieldConfiguration]) => {
        const fieldElement = getFieldElement(registrationField);

        if (!fieldElement) return;

        const fieldContainer = getFieldContainer(registrationField);
        const dependentFields = getDependentFields(fieldConfiguration);

        hideDependentFields(dependentFields);
        reorderDependentFields(fieldContainer, dependentFields);
        addFieldListeners(fieldElement, dependentFields, fieldConfiguration);
    });
}


$(document).ready(function() {
    const observer = new MutationObserver(() => {
        const form = document.getElementById('register');

        if (form) {
            initializeConditionalFields();
            observer.disconnect();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
});
