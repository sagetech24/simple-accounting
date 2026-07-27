<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $currencyCodes = array_keys(config('currencies', []));

        return [
            'brand_name' => ['required', 'string', 'max:255'],
            'tagline' => ['nullable', 'string', 'max:500'],
            'default_currency' => ['required', 'string', Rule::in($currencyCodes)],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function settingAttributes(): array
    {
        return $this->validated();
    }
}
