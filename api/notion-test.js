export default async function handler(req, res) {
  const token = process.env.NOTION_TOKEN;

  if (!token) {
    return res.status(500).json({
      success: false,
      error: "NOTION_TOKEN not found"
    });
  }

  try {
    const response = await fetch("https://api.notion.com/v1/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Notion-Version": "2025-09-03",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        page_size: 1
      })
    });

    const data = await response.json();

    return res.status(response.status).json(data);

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
