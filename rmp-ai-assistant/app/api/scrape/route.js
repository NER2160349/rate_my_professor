// app/api/scrape/route.js
import { exec } from 'child_process';
import path from 'path';

export async function POST(request) {
  const { professorUrl } = await request.json();

  // Determine which script to run based on the URL
  let scriptName;
  if (professorUrl.includes('ratemyprofessors.com/professor')) {
    scriptName = 'scrape_professor_data.py';
  } else if (professorUrl.includes('ratemyprofessors.com/school')) {
    scriptName = 'scrape_school_data.py';
  } else {
    return new Response(JSON.stringify({ success: false, error: 'Invalid URL provided' }), { status: 400 });
  }

  // Define the Python script path based on the determined script
  const scriptPath = path.join(process.cwd(), 'rmp-ai-assistant-python', scriptName);

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
