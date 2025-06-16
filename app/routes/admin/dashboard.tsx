import { Header } from "../../../components"
const dashboard = () => {

  const user = {
    name: 'Nikhil',}
  return (
    <div>
      <main className="dashboard wrapper">
        <Header 
        title={`Welcome ${user?.name ?? 'Guest'} 👋`}
        description="Track Activity, trends and popular destinations in real time."
        />
        Dashboard page contents
      </main>
    </div>
  )
}

export default dashboard
