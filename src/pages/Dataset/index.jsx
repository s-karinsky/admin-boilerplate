import DatasetTable from '../../components/DatasetTable'
import { useFormDescription } from '../../utils/hooks'

export default function PageDataset({
  name
}) {
  const formDesc = useFormDescription('1')
  
  return !formDesc.isLoading && <DatasetTable
    {...formDesc?.data}
    id={name}
  />
}