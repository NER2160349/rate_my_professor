// app/api/scrape/route.js
import { exec } from 'child_process';
import path from 'path';

export async function POST(request) {
  const { professorUrl } = await request.json();

  // Define the Python script path
  const scriptPath = path.join(process.cwd(), 'rmp-ai-assistant-python', 'scrape_professor_data.py');

  return new Promise((resolve, reject) => {
    exec(`python3 ${scriptPath} ${professorUrl}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing script: ${error.message}`);
        return resolve(new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 }));
      }
      if (stderr) {
        console.error(`Script stderr: ${stderr}`);
        return resolve(new Response(JSON.stringify({ success: false, error: stderr }), { status: 500 }));
      }

      console.log(`Script stdout: ${stdout}`);
      resolve(new Response(JSON.stringify({ success: true, output: stdout }), { status: 200 }));
    });
  });
}
