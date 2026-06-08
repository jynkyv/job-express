Set shell = CreateObject("WScript.Shell")
shell.CurrentDirectory = "E:\Desktop\JOBEXPRESS6.2"

nodeExe = "C:\Program Files\nodejs\node.exe"
guardianEntry = "E:\Desktop\JOBEXPRESS6.2\jobexpress-guardian.cjs"
command = """" & nodeExe & """ """ & guardianEntry & """"

shell.Run command, 0, False
WScript.Sleep 2500
shell.Run "http://127.0.0.1:3000/", 1, False

Do
  WScript.Sleep 60000
Loop
