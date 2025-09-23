// Sample Netlify Function to ensure functions work properly
export async function handler(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Netlify Functions are working!" }),
  };
}
