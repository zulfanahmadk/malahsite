<?php

namespace App\Http\Controllers;

use App\Models\Template;
use Illuminate\Http\Request;

class TemplateController extends Controller
{
    /**
     * Get all active templates with filters
     */
    public function index(Request $request)
    {
        $query = Template::where('is_active', true);

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by category
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        // Search by name
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Get distinct categories for filters
        $categories = Template::distinct()->pluck('category');

        return response()->json([
            'templates' => $query->get(),
            'categories' => $categories,
        ]);
    }

    /**
     * Get single template by ID
     */
    public function show(Template $template)
    {
        if (!$template->is_active) {
            return response()->json(['message' => 'Template not found'], 404);
        }

        return response()->json($template);
    }

    /**
     * Get template demo
     */
    public function demo(Template $template)
    {
        if (!$template->is_active) {
            return response()->json(['message' => 'Template not found'], 404);
        }

        return response()->json([
            'demo_url' => $template->demo_url,
            'template' => $template,
        ]);
    }

    /**
     * Admin: Create new template
     */
    public function store(Request $request)
    {
        $this->authorize('isAdmin');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file_path' => 'required|string',
            'thumbnail_path' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'type' => 'required|in:wedding,booth',
            'category' => 'nullable|string',
            'demo_url' => 'nullable|url',
        ]);

        $template = Template::create($validated);

        return response()->json($template, 201);
    }

    /**
     * Admin: Update template
     */
    public function update(Request $request, Template $template)
    {
        $this->authorize('isAdmin');

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'category' => 'nullable|string',
            'demo_url' => 'nullable|url',
            'is_active' => 'sometimes|boolean',
        ]);

        $template->update($validated);

        return response()->json($template);
    }

    /**
     * Admin: Delete template
     */
    public function destroy(Template $template)
    {
        $this->authorize('isAdmin');

        // Check if template has active subscriptions
        if ($template->subscriptions()->where('status', 'active')->exists()) {
            return response()->json([
                'message' => 'Cannot delete template with active subscriptions',
            ], 409);
        }

        $template->delete();

        return response()->json(['message' => 'Template deleted']);
    }
}
