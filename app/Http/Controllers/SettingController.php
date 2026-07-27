<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateSettingRequest;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class SettingController extends Controller
{
    /**
     * Update the singleton application settings.
     */
    public function update(UpdateSettingRequest $request): RedirectResponse
    {
        Setting::current()->update($request->settingAttributes());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'System preferences saved.',
        ]);

        return back();
    }
}
