import FroalaEditorComponent from 'react-froala-wysiwyg'
import 'froala-editor/css/froala_editor.pkgd.min.css'
import 'froala-editor/css/froala_style.min.css'
import 'froala-editor/js/plugins.pkgd.min.js'
import { froalaConfig } from '../../config/froala'

interface TopicEditorFieldProps {
  error?: string
  value: string
  onChange: (value: string) => void
}

export const TopicEditorField = ({ error, value, onChange }: TopicEditorFieldProps) => (
  <div className="grid gap-2">
    <span className="text-sm font-bold text-slate-800">Nội dung</span>
    <FroalaEditorComponent config={froalaConfig} model={value} onModelChange={onChange} tag="textarea" />
    {error && <p className="text-sm text-red-700">{error}</p>}
  </div>
)
