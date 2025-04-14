import { Form, useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

export const loader = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/todos/`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return json({ todos: [] });
      }
      throw new Error(`Error fetching todos: ${response.statusText}`);
    }
    const todos = await response.json();
    return json({ todos });
  } catch (error) {
    console.error("Failed to load todos:", error);
    return json({ todos: [], error: "Failed to load todos" });
  }
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const action = formData.get("_action");

  try {
    if (action === "create") {
      const title = formData.get("title");
      const content = formData.get("content");
      
      if (!title || !content) {
        return json({ error: "Title and content are required" });
      }
      
      const response = await fetch(`${API_BASE_URL}/todos/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          is_completed: false
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return json({ error: errorData.detail || "Failed to create todo" });
      }
    }

    if (action === "toggle") {
      const id = formData.get("id");
      const is_completed = formData.get("is_completed") === "true" ? false : true;
      const title = formData.get("title");
      const content = formData.get("content");
      
      const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: Number(id),
          title,
          content,
          is_completed
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return json({ error: errorData.detail || "Failed to update todo" });
      }
    }

    if (action === "delete") {
      const id = formData.get("id");
      
      const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return json({ error: errorData.detail || "Failed to delete todo" });
      }
    }

    return redirect("/");
  } catch (error) {
    console.error("Action failed:", error);
    return json({ error: "Failed to process action" });
  }
};

export default function Index() {
  const { todos, error } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state !== "idle";
  const [newTodoVisible, setNewTodoVisible] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Todo</h1>
          <button
            onClick={() => setNewTodoVisible(!newTodoVisible)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {newTodoVisible ? "Cancel" : "Add New Todo"}
          </button>
        </header> 

        {(error || actionData?.error) && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error || actionData?.error}</p>
          </div>
        )}

        {newTodoVisible && (
          <div className="mb-8 bg-white shadow-md rounded-2xl px-8 pt-6 pb-8">
            <Form method="post" className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg- leading-tight focus:outline-none focus:shadow-outline bg-[#36454F]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="content">
                  Content
                </label>
                <textarea
                  name="content"
                  id="content"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline h-24 bg-[#36454F]"
                  required
                ></textarea>
              </div>
              
              <button
                type="submit"
                name="_action"
                value="create"
                disabled={isSubmitting}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                {isSubmitting ? "Adding..." : "Add Todo"}
              </button>
            </Form>
          </div>
        )}

        <div className="bg-white shadow-md rounded-2xl px-10 py-8">
          {todos.length === 0 ? (
            <p className="text-gray-500 flex justify-center">No todos</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {todos.map((todo) => (
                <li key={todo.id} className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900">{todo.title}</h3>
                      <p className="mt-1 text-gray-500">{todo.content}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {/* Update Todo Status Form */}
                      <Form method="post" className="inline">
                        <input type="hidden" name="id" value={todo.id} />
                        <input type="hidden" name="title" value={todo.title} />
                        <input type="hidden" name="content" value={todo.content} />
                        <input type="hidden" name="is_completed" value={todo.is_completed} />
                        <button
                          type="submit"
                          name="_action"
                          value="toggle"
                          className={`${
                            todo.is_completed
                              ? "bg-green-500 hover:bg-green-700"
                              : "bg-yellow-500 hover:bg-yellow-700"
                          } text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline`}
                        >
                          {todo.is_completed ? "Completed" : "Mark Done"}
                        </button>
                      </Form>

                      <Form method="post" className="inline">
                        <input type="hidden" name="id" value={todo.id} />
                        <button
                          type="submit"
                          name="_action"
                          value="delete"
                          className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline"
                        >
                          Delete
                        </button>
                      </Form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}